const CSV_PATHS = {
    'shortboard_men': './data/ranking/shortboard_men.csv',
    'longboard_men': './data/ranking/longboard_men.csv',
    'shortboard_women': './data/ranking/shortboard_women.csv',
    'longboard_women': './data/ranking/longboard_women.csv'
};

async function loadCSV(category) {
    try {
        const response = await fetch(CSV_PATHS[category]);
        const data = await response.text();
        return data
            .split('\n')
            .slice(1)
            .filter(row => row.trim() !== '')
            .map(row => {
                const columns = row.split(',');
                if (columns.length < 14) return null;
                return {
                    Rank: columns[0].trim(),
                    Name: columns[1].trim(),
                    Region: columns[3].trim(),
                    TotalPoints: columns[13].trim() || '0'
                };
            })
            .filter(item => item !== null)
            .slice(0, 5);
    } catch (error) {
        console.error('Ошибка загрузки CSV:', error);
        return [];
    }
}

function createAthleteItem(athlete) {
    const bestResult = athlete.BestPlace ? `${athlete.BestPlace} место в ${athlete.BestYear}` : 'Нет данных';

    return `
        <div class="athlete-item">
            <div class="athlete-rank">${athlete.Rank}</div>
            <div class="athlete-avatar"></div>
            <div class="athlete-info">
                <div class="athlete-name">${athlete.Name}</div>
                <div class="athlete-region">${athlete.Region}</div>
            </div>
            <div class="athlete-points">${athlete.TotalPoints}</div>

            <div class="athlete-tooltip">
                <div class="tooltip-header">
                    <div class="tooltip-name">${athlete.Name}</div>
                    <div class="tooltip-region">${athlete.Region}</div>
                </div>
                <div class="tooltip-rank">#${athlete.Rank} в рейтинге</div>
                <div class="tooltip-best-result">
                    <div class="tooltip-best-year">Лучший результат:</div>
                    <div class="tooltip-best-event">${bestResult}</div>
                </div>
                <a href="https://topheats.ru/${athlete.Name.replace(/ /g, '-')}"
                   class="tooltip-social"
                   target="_blank">
                    Страница спортсмена
                </a>
            </div>
        </div>
    `;
}

function createGroupHTML(data, title, link) {
    return `
        <h2 class="group-title">${title}</h2>
        ${data.map(athlete => createAthleteItem(athlete)).join('')}
        <a href="${link}" class="full-ranking-link">Полный рейтинг →</a>
    `;
}

async function init() {
    const categories = [
        {
            id: 'shortboard-men',
            title: 'Короткая доска, Мужчины',
            link: 'https://odinsy.github.io/topheats-rating/src/pages/ranking/index.html?category=shortboard_men'
        },
        {
            id: 'longboard-men',
            title: 'Длинная доска, Мужчины',
            link: 'https://odinsy.github.io/topheats-rating/src/pages/ranking/index.html?category=longboard_men'
        },
        {
            id: 'shortboard-women',
            title: 'Короткая доска, Женщины',
            link: 'https://odinsy.github.io/topheats-rating/src/pages/ranking/index.html?category=shortboard_women'
        },
        {
            id: 'longboard-women',
            title: 'Длинная доска, Женщины',
            link: 'https://odinsy.github.io/topheats-rating/src/pages/ranking/index.html?category=longboard_women'
        }
    ];

    for (const category of categories) {
        const [boardType, gender] = category.id.split('-');
        const csvKey = `${boardType}_${gender}`;
        const data = await loadCSV(csvKey);
        if (data.length > 0) {
            document.getElementById(category.id).innerHTML = createGroupHTML(
                data,
                category.title,
                category.link
            );
        }
    }
}

init();
