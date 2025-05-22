const CSV_PATHS = {
    'shortboard_men': './data/ranking/shortboard_men.csv',
    'longboard_men': './data/ranking/longboard_men.csv',
    'shortboard_women': './data/ranking/shortboard_women.csv',
    'longboard_women': './data/ranking/longboard_women.csv'
};

// Генерация случайного цвета для аватара
function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 60%, 80%)`;
}

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

function createAthleteList(data) {
    return data.map(athlete => `
        <div class="athlete-item">
            <div class="athlete-avatar" style="background: ${getRandomColor()}"></div>
            <div class="athlete-info">
                <div class="athlete-name">${athlete.Name}</div>
                <div class="athlete-region">${athlete.Region}</div>
            </div>
            <div class="athlete-points">${athlete.TotalPoints}</div>
        </div>
    `).join('');
}

async function init() {
    const elements = [
        { id: 'shortboard-men', category: 'shortboard_men' },
        { id: 'longboard-men', category: 'longboard_men' },
        { id: 'shortboard-women', category: 'shortboard_women' },
        { id: 'longboard-women', category: 'longboard_women' }
    ];

    for (const {id, category} of elements) {
        const data = await loadCSV(category);
        if (data.length > 0) {
            document.getElementById(id).innerHTML = createAthleteList(data);
        }
    }
}

init();
