document.addEventListener('DOMContentLoaded', () => {
    let currentData = [];
    let sortState = { column: null, asc: true };

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
        const rows = csv.split('\n')
            .slice(1) // Пропускаем заголовок
            .filter(row => row.trim().length > 0); // Фильтруем пустые строки

        return rows.map(row => {
            const columns = row.split(',').map(c => c.trim());

            // Проверка на валидность строки
            if(columns.length < 14) return null;

            return {
                Rank: columns[0] || '',
                Name: columns[1] || '',
                Birthday: columns[2] || '',
                Region: columns[3] || '',
                BestPlace: columns[5] || '',
                '2017': columns[6] || '0',
                '2018': columns[7] || '0',
                '2019': columns[8] || '0',
                '2021': columns[9] || '0',
                '2022': columns[10] || '0',
                '2023': columns[11] || '0',
                '2024': columns[12] || '0',
                'Total Points': columns[13] || '0',
                Social: 'https://vk.com/topheats'
            };
        }).filter(item => item !== null); // Удаляем некорректные записи
    }

    function renderTable(data) {
        const tbody = document.querySelector('#rankingTable tbody');
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="compact-column">${item.Rank}</td>
                <td class="name-cell">
                    ${item.Name}
                    <div class="tooltip">
                        <span>Год рождения: ${item.Birthday}</span>
                        <a href="${item.Social}" target="_blank">Соцсети</a>
                    </div>
                </td>
                <td>${item.Region}</td>
                <td class="compact-column">${item.BestPlace}</td>
                <td class="compact-column">${item['2017']}</td>
                <td class="compact-column">${item['2018']}</td>
                <td class="compact-column">${item['2019']}</td>
                <td class="compact-column">${item['2021']}</td>
                <td class="compact-column">${item['2022']}</td>
                <td class="compact-column">${item['2023']}</td>
                <td class="compact-column">${item['2024']}</td>
                <td class="compact-column total-points">${item['Total Points']}</td>
            `;
            if(index % 2 === 0) row.style.backgroundColor = '#fdfdfd';
            tbody.appendChild(row);
        });
    }

    function sortTable(columnIndex) {
        const columns = ['Rank', 'Name', 'Region', 'BestPlace', '2017', '2018',
                       '2019', '2021', '2022', '2023', '2024', 'Total Points'];
        const key = columns[columnIndex];

        currentData.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if(['Rank', 'BestPlace', '2017', '2018', '2019',
               '2021', '2022', '2023', '2024', 'Total Points'].includes(key)) {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            if(valA === valB) return 0;
            const direction = sortState.asc ? 1 : -1;

            return (valA > valB ? 1 : -1) * direction;
        });

        sortState.asc = !sortState.asc;
        sortState.column = key;

        renderTable(currentData);
    }

    document.querySelectorAll('th').forEach((th, index) => {
        th.addEventListener('click', () => sortTable(index));
    });

    loadData();
});
