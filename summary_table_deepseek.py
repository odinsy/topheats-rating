import csv
from collections import defaultdict
from typing import Dict, List

# Конфигурационные параметры
SCORING = {
    1: 1000,
    2: 900,
    3: 800,
    4: 700,
    (5, 8): 500,
    (9, 16): 300,
    (17, 32): 200
}

RANK_BONUS = {
    'МС': 80,
    'КМС': 50,
    '1 разряд': 30,
    '2 разряд': 20,
    '3 разряд': 10,
    '': 0
}

YEARS_ORDER = [2017, 2018, 2019, 2021, 2022, 2023, 2024]
OUTPUT_COLUMNS = ['Rank', 'ФИО', 'Регион', 'Разряд'] + [str(y) for y in YEARS_ORDER] + ['Total Points']

ENABLE_RANK_BONUS = False
ENABLE_YEAR_BONUS = False
ENABLE_DECAY = False
DECAY_FACTOR = 0.8
PARTICIPATION_BONUS = 50
CURRENT_YEAR = 2024
TOP_N = 16

def parse_files(file_paths: List[str]) -> Dict[str, Dict]:
    athletes = defaultdict(lambda: {
        'years': defaultdict(int),
        'last_rank': '',
        'last_region': '',
        'ranks': defaultdict(str),
        'regions': defaultdict(str)
    })

    for file_path in file_paths:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    year = int(row['Год'])
                    place = int(row['Место']) if row['Место'].isdigit() else 0
                except (ValueError, KeyError):
                    continue

                full_name = ' '.join(row['ФИО'].split()[:2])
                region = row['Регион'].strip()
                rank = row['Разряд'].strip()

                # Сохраняем последние данные
                athletes[full_name]['ranks'][year] = rank
                athletes[full_name]['regions'][year] = region
                athletes[full_name]['years'][year] = place

    # Выбираем последние известные значения
    for athlete in athletes.values():
        athlete['last_rank'] = max(athlete['ranks'].items(), key=lambda x: x[0])[1] if athlete['ranks'] else ''
        athlete['last_region'] = max(athlete['regions'].items(), key=lambda x: x[0])[1] if athlete['regions'] else ''

    return athletes

def calculate_score(placement: int) -> int:
    for k, v in SCORING.items():
        if isinstance(k, tuple) and k[0] <= placement <= k[1]:
            return v
        elif placement == k:
            return v
    return 0

def process_athletes(data: Dict[str, Dict]) -> List[Dict]:
    results = []

    for name, info in data.items():
        entry = {
            'name': name,
            'region': info['last_region'],
            'rank': info['last_rank'],
            'years': defaultdict(int),
            'total': 0
        }

        total = 0
        for year in YEARS_ORDER:
            place = info['years'].get(year, 0)
            if place == 0:
                entry['years'][year] = 0
                continue

            decay = DECAY_FACTOR ** (CURRENT_YEAR - year) if ENABLE_DECAY else 1
            score = calculate_score(place) * decay
            participation = PARTICIPATION_BONUS * decay if ENABLE_YEAR_BONUS else 0

            entry['years'][year] = round(score + participation)
            total += score + participation

        if ENABLE_RANK_BONUS:
            total += RANK_BONUS.get(entry['rank'], 0)

        entry['total'] = round(total)
        results.append(entry)

    return sorted(results, key=lambda x: -x['total'])

def save_and_print(results: List[Dict]):
    # Вывод в консоль
    header = f"{'Rank':<5} {'ФИО':<25} {'Регион':<25} {'Разряд':<10} " + \
             ' '.join(f"{str(y):<6}" for y in YEARS_ORDER) + "Total"
    print(header)

    for i, athlete in enumerate(results[:TOP_N], 1):
        year_scores = [str(athlete['years'].get(year, 0)) for year in YEARS_ORDER]
        row = f"{i:<5} {athlete['name']:<25} {athlete['region']:<25} " + \
              f"{athlete['rank']:<10} " + ' '.join(f"{s:<6}" for s in year_scores) + \
              f"{athlete['total']}"
        print(row)

    # Сохранение в CSV
    with open('rating.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(OUTPUT_COLUMNS)

        for i, athlete in enumerate(results, 1):
            row = [
                i,
                athlete['name'],
                athlete['region'],
                athlete['rank'],
                *[athlete['years'].get(year, 0) for year in YEARS_ORDER],
                athlete['total']
            ]
            writer.writerow(row)

if __name__ == '__main__':
    files = [f'shortboard/shortboard_men_{y}.csv' for y in YEARS_ORDER]
    data = parse_files(files)
    results = process_athletes(data)
    save_and_print(results)
