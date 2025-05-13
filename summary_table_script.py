import pandas as pd
from collections import defaultdict

# Пути к файлам данных (предполагается, что файлы существуют)
file_paths = {
    '2018': 'shortboard_men_2018.csv',
    '2019': 'shortboard_men_2019.csv',
    '2021': 'shortboard_men_2021.csv',
    '2022': 'shortboard_men_2022.csv',
    '2023': 'shortboard_men_2023.csv',
    '2024': 'shortboard_men_2024.csv'
}

# Коэффициенты уменьшения баллов
decay_factors = {
    '2024': 1.0,
    '2023': 0.95,
    '2022': 0.90,
    '2021': 0.85,
    '2019': 0.75,
    '2018': 0.70
}

# Функция для определения базовых баллов по месту
def get_points(place):
    if place == 1:
        return 1000
    elif place == 2:
        return 900
    elif place == 3:
        return 800
    elif place == 4:
        return 700
    elif 5 <= place <= 8:
        return 500
    elif 9 <= place <= 16:
        return 300
    elif 17 <= place <= 32:
        return 100
    else:
        return 0

# Функция для определения дополнительных баллов за разряд
def get_rank_bonus(rank):
    bonuses = {
        'МС': 100,
        'КМС': 80,
        '1': 60,
        '2': 40,
        '3': 20
    }
    return bonuses.get(rank, 0)

# Нормализация имен
def normalize_name(name):
    parts = name.strip().split()
    if len(parts) > 2:
        return ' '.join(parts[:2])
    return name.strip()

# Словари для хранения баллов
points_dict = defaultdict(lambda: defaultdict(int))
total_points = defaultdict(int)

# Обработка данных
for year, file_path in file_paths.items():
    df = pd.read_csv(file_path)
    for _, row in df.iterrows():
        place = row['Место']
        if str(place).isdigit():
            place = int(place)
            name = normalize_name(row['ФИО'])
            rank = str(row['Разряд']).strip()
            
            # Базовые баллы за место
            points = get_points(place)
            
            # Дополнительные баллы за разряд
            rank_bonus = get_rank_bonus(rank)
            
            # Итоговые баллы с учетом уменьшения за год
            decayed_points = int((points + rank_bonus) * decay_factors[year])
            
            points_dict[name][year] = decayed_points
            total_points[name] += decayed_points

# Сортировка участников по общему количеству баллов
sorted_participants = sorted(total_points.items(), key=lambda x: x[1], reverse=True)[:16]

# Формирование сводной таблицы
summary_table = []
for i, (name, total) in enumerate(sorted_participants, 1):
    row = [i, name]
    for year in file_paths.keys():
        row.append(points_dict[name].get(year, 0))
    row.append(total)
    summary_table.append(row)

# Создание DataFrame
columns = ['Место', 'ФИО'] + list(file_paths.keys()) + ['Итог']
summary_df = pd.DataFrame(summary_table, columns=columns)

# Вывод и сохранение таблицы
print(summary_df)
summary_df.to_csv('summary_table.csv', index=False, encoding='utf-8')