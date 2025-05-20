document.addEventListener('DOMContentLoaded', () => {
    let currentData = [];
    let sortState = { column: null, asc: true };

    const config = {
        fieldMap: {
            staticFields: {
                Rank: { index: 0, default: '' },
                Name: { index: 1, default: '' },
                Birthday: { index: 2, default: '' },
                Region: { index: 3, default: '' },
                BestPlace: { index: 5, default: '' },
                Social: { index: null, default: 'https://vk.com/topheats' }
            },
            dynamicFields: {
                years: {
                    startIndex: 6,
                    list: ['2017', '2018', '2019', '2021', '2022', '2023', '2024']
                },
                TotalPoints: { index: -1 }
            }
        }
    };

    async function loadData() {
        try {
            const response = await fetch('../../ranking/longboard_men.csv');
            const csvData = await response.text();
            currentData = parseCSV(csvData);
            renderTable(currentData);
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    }

    function parseCSV(csv) {
        return csv.split('\n')
            .slice(1)
            .filter(row => row.trim().length > 0)
            .map(row => {
                const columns = row.split(',').map(c => c.trim());
                const athlete = {};

                for(const [field, settings] of Object.entries(config.fieldMap.staticFields)) {
                    athlete[field] = settings.index !== null
                        ? (columns[settings.index] || settings.default)
                        : settings.default;
                }

                config.fieldMap.dynamicFields.years.list.forEach((year, idx) => {
                    const colIndex = config.fieldMap.dynamicFields.years.startIndex + idx;
                    athlete[year] = columns[colIndex] || '0';
                });

                athlete.TotalPoints = columns[columns.length - 1] || '0';
                return athlete;
            });
    }

    function renderTable(data) {
        const tbody = document.querySelector('#rankingTable tbody');
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
        const columns = [
            ...Object.keys(config.fieldMap.staticFields),
            ...config.fieldMap.dynamicFields.years.list,
            'TotalPoints'
        ];

        const sortKey = columns[columnIndex];

        currentData.sort((a, b) => {
            const valA = a[sortKey] || '';
            const valB = b[sortKey] || '';

            const isNumeric = !isNaN(valA) && !isNaN(valB);
            const direction = sortState.asc ? 1 : -1;

            return isNumeric
                ? (parseFloat(valA) - parseFloat(valB)) * direction
                : String(valA).localeCompare(String(valB), 'ru') * direction;
        });

        sortState.asc = !sortState.asc;
        renderTable(currentData);
    }

    document.querySelectorAll('th').forEach((th, index) => {
        th.addEventListener('click', () => sortTable(index));
    });

    loadData();
});
