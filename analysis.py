import pandas as pd
import yaml
from collections import defaultdict
from datetime import datetime

# Конфигурация
def load_config():
    with open("config.yaml") as f:
        return yaml.safe_load(f)["trends"]

# Нормализация регионов
REGION_MAPPING = {
    "Москва": "Москва",
    "Московская область": "Москва",
    "Калининград": "Калининград",
    "Калининградская область": "Калининград"
}

def normalize_region(region):
    return REGION_MAPPING.get(region, region)

# Загрузка и подготовка данных
def load_data(config):
    df = pd.read_csv(config["input_ranking_file"])
    df["BirthYear"] = pd.to_numeric(df["Birthday"], errors="coerce")
    return df

# Сбор активных участников по годам
def get_active_athletes(df, years):
    athletes = {}
    for year in years:
        active = df[df[str(year)] > 0]["Name"].unique()
        athletes[year] = set(active)
    return athletes

# Расчет общей статистики
def calculate_general_stats(df, years, athletes_by_year):
    general_stats = []
    prev_athletes = set()

    for year in sorted(years):
        current_athletes = athletes_by_year[year]
        new_athletes = current_athletes - prev_athletes if year != 2017 else set()

        # Расчет возраста новых участников
        ages = []
        for name in new_athletes:
            birth_year = df[df["Name"] == name]["BirthYear"].values[0]
            if not pd.isna(birth_year) and birth_year > 1900:
                ages.append(year - int(birth_year))

        avg_age = round(sum(ages) / len(ages), 1) if ages else None

        general_stats.append({
            "Год": year,
            "Всего участников": len(current_athletes),
            "Новые": len(new_athletes),
            "Доля новых (%)": round(len(new_athletes)/len(current_athletes)*100, 2) if len(current_athletes) > 0 else 0.0,
            "Средний возраст": avg_age
        })
        prev_athletes.update(current_athletes)

    # Корректировка для 2017 года
    general_stats[0]["Доля новых (%)"] = 0.0
    return general_stats

# Расчет детализированной статистики
def calculate_detailed_stats(df, general_stats, athletes_by_year, years):
    detailed_data = defaultdict(lambda: defaultdict(int))
    all_regions = defaultdict(int)

    for entry in general_stats:
        year = entry["Год"]
        if year == 2017:
            continue

        current_athletes = athletes_by_year[year]
        prev_athletes = set().union(*[athletes_by_year[y] for y in years if y < year])
        new_athletes = current_athletes - prev_athletes

        for name in new_athletes:
            region = df[df["Name"] == name]["Region"].values[0]
            norm_region = normalize_region(region)
            detailed_data[year][norm_region] += 1
            all_regions[norm_region] += 1

    # Упорядочивание регионов
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

    return pd.DataFrame(rows)

# Основная функция
def main():
    config = load_config()
    years = [2017, 2018, 2019, 2021, 2022, 2023, 2024]

    df = load_data(config)
    athletes_by_year = get_active_athletes(df, years)

    # Общая статистика
    general_stats = calculate_general_stats(df, years, athletes_by_year)
    pd.DataFrame(general_stats).to_csv(config["output_general_file"], index=False)

    # Детализированная статистика
    detailed_df = calculate_detailed_stats(df, general_stats, athletes_by_year, years)
    detailed_df.to_csv(config["output_detailed_file"], index=False)

if __name__ == "__main__":
    main()
