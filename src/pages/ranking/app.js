document.addEventListener('DOMContentLoaded', () => {
    let currentData = [];
    let sortState = { column: null, asc: true };

    // Конфигурация
    const config = {
        fieldMap: {
            staticFields: {
                Rank: { index: 0, type: 'number' },
                Name: { index: 1, type: 'text' },
                Region: { index: 3, type: 'text' },
                BestPlace: { index: 5, type: 'number' }
            },
            dynamicFields: {
                years: [2017, 2018, 2019, 2021, 2022, 2023, 2024],
                startIndex: 6
            }
        }
    };

    // Инициализация
    initCategorySelector();
    
    function initCategorySelector() {
        const selector = document.getElementById('categorySelect');
        selector.addEventListener('change', loadData);
        loadData();
    }

    async function loadData() {
        const category = document.getElementById('categorySelect').value;
        try {
            const response = await fetch(`../ranking/${category}.csv`);
            const csv = await response.text();
            currentData = parseCSV(csv);
            renderTable();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }

    function parseCSV(csv) {
        return csv.split('\n')
            .slice(1)
            .filter(row => row.trim())
            .map(row => {
                const cols = row.split(',');
                const athlete = {
                    Rank: parseNumber(cols[0]),
                    Name: cols[1],
                    Region: cols[3],
                    BestPlace: parseNumber(cols[5])
                };
                
                config.fieldMap.dynamicFields.years.forEach((year, i) => {
                    athlete[year] = parseNumber(cols[config.fieldMap.dynamicFields.startIndex + i]);
                });
                
                athlete.Total = parseNumber(cols[cols.length - 1]);
                return athlete;
            });
    }

    function parseNumber(value) {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    function renderTable() {
        const tbody = document.querySelector('#rankingTable tbody');
        tbody.innerHTML = '';
        
        currentData.forEach(athlete => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="sticky-col rank-col">${athlete.Rank}</td>
                <td class="sticky-col name-col">${athlete.Name}</td>
                <td>${athlete.Region}</td>
                <td>${athlete.BestPlace}</td>
                ${config.fieldMap.dynamicFields.years.map(year => `
                    <td>${athlete[year]}</td>
                `).join('')}
                <td class="sticky-col total-col">${athlete.Total}</td>
            `;
            tbody.appendChild(row);
        });
    }
});