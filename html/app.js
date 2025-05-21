const CSV_PATHS = {
    'shortboard_men': '../ranking/shortboard_men.csv',
    'longboard_men': '../ranking/longboard_men.csv',
    'shortboard_women': '../ranking/shortboard_women.csv',
    'longboard_women': '../ranking/longboard_women.csv'
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

function createTable(data, title, link) {
    return `
        <h2>${title}</h2>
        <table>
            ${data.map(athlete => `
                <tr>
                    <td>${athlete.Rank}</td>
                    <td>${athlete.Name}<span class="region">${athlete.Region}</span></td>
                    <td>${athlete.TotalPoints}</td>
                </tr>
            `).join('')}
        </table>
        <a href="${link}">Полный рейтинг →</a>  <!-- Убрал target="_blank" -->
    `;
}

async function init() {
    const categories = [
        {
            id: 'shortboard-men',
            title: 'Короткая доска, Мужчины',
            link: 'https://odinsy.github.io/topheats-rating/html/ranking/index.html?category=shortboard_men'
        },
        {
            id: 'longboard-men',
            title: 'Длинная доска, Мужчины',
            link: 'https://odinsy.github.io/topheats-rating/html/ranking/index.html?category=longboard_men'
        },
        {
            id: 'shortboard-women',
            title: 'Короткая доска, Женщины',
            link: 'https://odinsy.github.io/topheats-rating/html/ranking/index.html?category=shortboard_women'
        },
        {
            id: 'longboard-women',
            title: 'Длинная доска, Женщины',
            link: 'https://odinsy.github.io/topheats-rating/html/ranking/index.html?category=longboard_women'
        }
    ];

    for (const category of categories) {
        const [boardType, gender] = category.id.split('-');
        const csvKey = `${boardType}_${gender}`;
        const data = await loadCSV(csvKey);
        if (data.length > 0) {
            document.getElementById(category.id).innerHTML = createTable(data, category.title, category.link);
        }
    }
}

init();
