import pandas as pd
import yaml
from collections import defaultdict

# Загрузка конфигурации
with open("config.yaml") as f:
    config = yaml.safe_load(f)["trends"]

# Нормализация регионов
REGION_MAPPING = {
    "Москва": "Москва",
    "Московская область": "Москва",
    "Калининград": "Калининград",
    "Калининградская область": "Калининград"
}

def normalize_region(region):
    return REGION_MAPPING.get(region, region)

# Загрузка данных
df = pd.read_csv(config["input_ranking_file"])
years = [2017, 2018, 2019, 2021, 2022, 2023, 2024]

# Сбор участников по годам (исключая нулевые очки)
athletes_by_year = {}
for year in years:
    active = df[df[str(year)] > 0]["Name"].unique()
    athletes_by_year[year] = set(active)

# Расчет новых участников
general_stats = []
prev_athletes = set()
for year in sorted(years):
    current_athletes = athletes_by_year[year]
    new_athletes = current_athletes - prev_athletes if year != 2017 else set()

    total = len(current_athletes)
    new = len(new_athletes)
    share = round(new / total * 100, 2) if total > 0 else 0.0

    # Для 2017 доля новых = 0% (по условию)
    if year == 2017:
        share = 0.0

    general_stats.append({
        "Год": year,
        "Всего участников": total,
        "Новые": new,
        "Доля новых (%)": share
    })

    prev_athletes.update(current_athletes)

# Сохранение общей статистики
pd.DataFrame(general_stats).to_csv(config["output_general_file"], index=False)

# Детализация по регионам
detailed_data = defaultdict(lambda: defaultdict(int))
all_regions = defaultdict(int)

for year_entry in general_stats:
    year = year_entry["Год"]
    current_athletes = athletes_by_year.get(year, set())
    prev_athletes = set().union(*[athletes_by_year[y] for y in years if y < year])
    new_athletes = current_athletes - prev_athletes if year != 2017 else set()

    # Сбор регионов для новых участников
    for name in new_athletes:
        region = df[df["Name"] == name]["Region"].values[0]
        norm_region = normalize_region(region)
        detailed_data[year][norm_region] += 1
        all_regions[norm_region] += 1

# Упорядочивание регионов по убыванию
sorted_regions = sorted(all_regions.keys(), key=lambda x: -all_regions[x])

# Формирование таблицы
rows = []
for year in years + ["All"]:
    row = {"Год": year}
    if year == "All":
        for region in sorted_regions:
            row[region] = all_regions[region]
    else:
        for region in sorted_regions:
            row[region] = detailed_data.get(year, {}).get(region, 0)
    rows.append(row)

# Сохранение детализированной статистики
pd.DataFrame(rows).to_csv(config["output_detailed_file"], index=False)
