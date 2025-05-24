document.addEventListener('DOMContentLoaded', () => {
    let currentData = [];
    let sortState = { column: null, asc: true };

    const config = {
        categories: {
            longboard_men: 'Longboard (Men)',
            longboard_women: 'Longboard (Women)',
            shortboard_men: 'Shortboard (Men)',
            shortboard_women: 'Shortboard (Women)'
        },
        fieldMap: {
            staticFields: {
                Rank: { index: 0, default: '', type: 'number' },
                Name: { index: 1, default: '', type: 'text' },
                Birthday: { index: 2, default: '', type: 'text' },
                Region: { index: 3, default: '', type: 'text' },
                BestPlace: { index: 5, default: '', type: 'number' },
                Social: { index: null, default: 'https://vk.com/topheats', type: 'text' }
            },
            dynamicFields: {
                years: {
                    startIndex: 6,
                    list: ['2017', '2018', '2019', '2021', '2022', '2023', '2024'],
                    type: 'number'
                },
                TotalPoints: { index: -1, type: 'number' }
            }
        },
        columnsOrder: [
            'Rank', 'Name', 'Region', 'BestPlace',
            ...['2017', '2018', '2019', '2021', '2022', '2023', '2024'],
            'TotalPoints'
        ]
    };

    // Инициализация
    initCategorySelector();
    loadCategoryData(getCurrentCategory());

    // Обработчики событий
    document.getElementById('categorySelect').addEventListener('change', handleCategoryChange);

    function initCategorySelector() {
        const selector = document.getElementById('categorySelect');
        const currentCategory = getCurrentCategory();

        selector.value = currentCategory;
    }

    function getCurrentCategory() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('category') || 'longboard_men';
    }

    function handleCategoryChange(e) {
        const category = e.target.value;
        updateURL(category);
        loadCategoryData(category);
    }

    function updateURL(category) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('category', category);
        window.history.pushState({}, '', newUrl);
    }

    async function loadCategoryData(category) {
        try {
            const response = await fetch(`../../data/rankings/${category}.json`);
            if(!response.ok) throw new Error('JSON not found');

            const { headers, athletes } = await response.json();
            currentData = athletes;
            renderTable(currentData);
        } catch (error) {
            console.error('Error:', error);
            alert('Данные временно недоступны');
        }
    }

    function parseValue(value, type) {
        if(type === 'number') return Number(value) || 0;
        return value;
    }

    function renderTable(data) {
        const tbody = document.querySelector('#rankingsTable tbody');
        tbody.innerHTML = '';

        data.forEach((athlete, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="compact-col">${athlete.Rank}</td>
                <td class="name-col name-cell">
                    ${athlete.Name}
                    <div class="tooltip">
                        <span>Год рождения: ${athlete.Birthday}</span>
                        ${athlete.Social ? `<a href="${athlete.Social}" target="_blank">Соцсети</a>` : ''}
                    </div>
                </td>
                <td class="region-col">${athlete.Region}</td>
                <td class="compact-col">${athlete.BestPlace}</td>
                ${config.fieldMap.dynamicFields.years.list
                    .map(year => `<td class="compact-col">${athlete[year]}</td>`)
                    .join('')}
                <td class="compact-col total-points">${athlete.TotalPoints}</td>
            `;
            row.style.backgroundColor = index % 2 === 0 ? '#fdfdfd' : '';
            tbody.appendChild(row);
        });
    }

    function sortTable(columnIndex) {
        const sortKey = config.columnsOrder[columnIndex];
        const sortType = getSortType(sortKey);

        currentData.sort((a, b) => {
            const valA = a[sortKey] ?? '';
            const valB = b[sortKey] ?? '';

            let result = 0;

            if(sortType === 'number') {
                result = (valA - valB);
            } else {
                result = String(valA).localeCompare(String(valB), 'ru');
            }

            return sortState.asc ? result : -result;
        });

        sortState.asc = !sortState.asc;
        renderTable(currentData);
    }

    function getSortType(key) {
        // Статические поля
        for(const [field, settings] of Object.entries(config.fieldMap.staticFields)) {
            if(field === key) return settings.type;
        }

        // Динамические годы
        if(config.fieldMap.dynamicFields.years.list.includes(key)) {
            return config.fieldMap.dynamicFields.years.type;
        }

        // Total Points
        if(key === 'TotalPoints') {
            return config.fieldMap.dynamicFields.TotalPoints.type;
        }

        return 'text';
    }

    document.querySelectorAll('th').forEach((th, index) => {
        th.addEventListener('click', () => sortTable(index));
    });

    // Обработчик изменения истории
    window.addEventListener('popstate', () => {
        const category = getCurrentCategory();
        document.getElementById('categorySelect').value = category;
        loadCategoryData(category);
    });
});
