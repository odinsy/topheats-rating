const CSV_PATHS = {
    'shortboard_men': '../ranking/shortboard_men.csv',
    'longboard_men': '../ranking/longboard_men.csv',
    'shortboard_women': '../ranking/shortboard_women.csv',
    'longboard_women': '../ranking/longboard_women.csv'
};

async function loadCSV(category) {
    const response = await fetch(CSV_PATHS[category]);
    const data = await response.text();
    return data.split('\n').slice(1).map(row => {
        const [Rank, Name, Birthday, Region, Category, BestPlace, ...rest] = row.split(',');
        const TotalPoints = rest.pop().trim();
        return { Rank, Name, Region, TotalPoints };
    }).slice(0, 5);
}

function createTable(data, title, link) {
    return `
        <h2>${title}</h2>
        <table>
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Points</th>
            </tr>
            ${data.map(athlete => `
                <tr>
                    <td>${athlete.Rank}</td>
                    <td>${athlete.Name}<span class="region">${athlete.Region}</span></td>
                    <td>${athlete.TotalPoints}</td>
                </tr>
            `).join('')}
        </table>
        <a href="${link}" target="_blank">Полный рейтинг →</a>
    `;
}

async function init() {
    const categories = [
        { id: 'shortboard-men', title: 'Короткая доска, Мужчины', link: 'https://...?category=shortboard_men' },
        { id: 'longboard-men', title: 'Длинная доска, Мужчины', link: 'https://...?category=longboard_men' },
        { id: 'shortboard-women', title: 'Короткая доска, Женщины', link: 'https://...?category=shortboard_women' },
        { id: 'longboard-women', title: 'Длинная доска, Женщины', link: 'https://...?category=longboard_women' }
    ];

    for (const category of categories) {
        const [boardType, gender] = category.id.split('-');
        const data = await loadCSV(`${boardType}_${gender}`);
        document.getElementById(category.id).innerHTML = createTable(data, category.title, category.link);
    }
}

init();
