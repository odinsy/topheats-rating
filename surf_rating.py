import csv
import yaml
import glob
from collections import defaultdict
from pathlib import Path
from typing import Dict, List

def load_config(config_path: str = 'config.yaml') -> Dict:
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    for system in config['scoring'].values():
        new_keys = {}
        for k in list(system.keys()):
            if '-' in str(k):
                min_max = tuple(map(int, k.split('-')))
                new_keys[min_max] = system.pop(k)
        system.update(new_keys)

    return config

CONFIG = load_config()

def parse_files() -> Dict[str, Dict]:
    athletes = defaultdict(lambda: {
        'years': defaultdict(str),
        'category': '',
        'regions': defaultdict(str),
        'ranks': defaultdict(str),
        'best_place': None,
        'last_year': 0  # Добавлено новое поле
    })

    for pattern in CONFIG['input_paths']:
        for file_path in glob.glob(pattern):
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                required = ['Год', 'ФИО', 'Регион', 'Разряд', 'Место']
                if not all(col in reader.fieldnames for col in required):
                    raise ValueError(f"Invalid columns in {file_path}")

                for row in reader:
                    year = int(row['Год'])
                    place = row['Место'].strip().upper()
                    name = ' '.join(row['ФИО'].split()[:2])
                    region = row['Регион'].strip()
                    rank = row['Разряд'].strip()

                    athletes[name]['years'][year] = place
                    athletes[name]['regions'][year] = region
                    athletes[name]['ranks'][year] = rank
                    athletes[name]['category'] = row['Категория']
                    athletes[name]['last_year'] = max(athletes[name]['last_year'], year)  # Обновляем последний год

                    if place != 'DNS' and place.isdigit():
                        current_place = int(place)
                        if (athletes[name]['best_place'] is None or
                            current_place < athletes[name]['best_place']):
                            athletes[name]['best_place'] = current_place

    for athlete in athletes.values():
        athlete['region'] = max(athlete['regions'].items())[1] if athlete['regions'] else ''
        athlete['rank'] = max(athlete['ranks'].items())[1] if athlete['ranks'] else ''

    return athletes

def calculate_points(place: str, year: int) -> int:
    system = CONFIG['scoring'][CONFIG['scoring_system']]

    if place == 'DNS':
        return system.get('DNS', 0)

    try:
        place_num = int(place)
    except ValueError:
        return 0

    for k, v in system.items():
        if isinstance(k, tuple) and k[0] <= place_num <= k[1]:
            return v
        elif place_num == k:
            return v
    return 0

def apply_bonuses(score: int, year: int, is_dns: bool) -> int:
    if CONFIG['bonuses']['decay']['enabled']:
        decay = CONFIG['bonuses']['decay']['factor'] ** (CONFIG['current_year'] - year)
        score = round(score * decay)

    if not is_dns and CONFIG['bonuses']['participation']['enabled']:
        score += CONFIG['bonuses']['participation']['points']

    return score

def process_athletes(data: Dict) -> List[Dict]:
    results = []

    for name, info in data.items():
        entry = {
            'name': name,
            'region': info['region'],
            'rank': info['rank'],
            'category': info['category'],
            'best_place': info['best_place'] or 9999,
            'last_year': info['last_year'],  # Добавляем в запись
            'years': defaultdict(int),
            'total': 0
        }

        total = 0
        for year, place in info['years'].items():
            is_dns = (place == 'DNS')
            points = calculate_points(place, year)
            points = apply_bonuses(points, year, is_dns)

            entry['years'][year] = points
            total += points

        if CONFIG['bonuses']['rank']['enabled']:
            total += CONFIG['bonuses']['rank']['values'].get(entry['rank'], 0)

        entry['total'] = total
        results.append(entry)

    # Новая логика сортировки
    if CONFIG['sorting']['enabled']:
        return sorted(results, key=lambda x: (-x['total'], x['best_place'], -x['last_year']))
    return sorted(results, key=lambda x: -x['total'])

def generate_output(results: List[Dict]):
    years = sorted({y for a in results for y in a['years']})
    columns = CONFIG['output']['columns']
    translate = CONFIG['output'].get('translate_columns', False)

    headers = []
    for col in columns:
        if col == 'YearScores':
            headers.extend(map(str, years))
        else:
            headers.append(col if not translate else {
                'Rank': 'Место',
                'Name': 'ФИО',
                'Region': 'Регион',
                'Category': 'Категория',
                'Best Place': 'Лучший результат',
                'Total Points': 'Всего очков'
            }.get(col, col))

    output_path = Path(CONFIG['output']['filename'])
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for i, athlete in enumerate(results, 1):
            row = [
                i,
                athlete['name'],
                athlete['region'],
                athlete['category'],
                athlete['best_place'] if athlete['best_place'] != 9999 else '-',
                *[athlete['years'].get(y, 0) for y in years],
                athlete['total']
            ]
            writer.writerow(row)

    print(','.join(map(str, headers)))
    for i, athlete in enumerate(results[:CONFIG['top_n']], 1):
        row = [
            i,
            athlete['name'],
            athlete['region'],
            athlete['category'],
            athlete['best_place'] if athlete['best_place'] != 9999 else '-',
            *[athlete['years'].get(y, 0) for y in years],
            athlete['total']
        ]
        print(','.join(map(str, row)))

if __name__ == '__main__':
    try:
        data = parse_files()
        results = process_athletes(data)
        generate_output(results)
    except Exception as e:
        print(f"Ошибка: {str(e)}")
        exit(1)
