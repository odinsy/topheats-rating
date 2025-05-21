const config = {
    basePath: '../../stats/trends',
    categories: {
        longboard_men: 'Longboard (Men)',
        longboard_women: 'Longboard (Women)',
        shortboard_men: 'Shortboard (Men)',
        shortboard_women: 'Shortboard (Women)'
    }
};

let chartInstance = null;

function initializeChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    displayColors: false,
                    callbacks: {
                        label: (context) => `${context.parsed.y.toFixed(1)} лет`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Год', color: '#7f8c8d' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Средний возраст', color: '#7f8c8d' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    min: 25,
                    max: 40
                }
            }
        }
    });
}

async function loadData(category, discipline) {
    const filename = `general_${category}_${discipline}_stats.csv`;
    const path = `${config.basePath}/${filename}`;
    
    try {
        const response = await fetch(path);
        const csvData = await response.text();
        
        const data = csvData.split('\n').slice(1)
            .map(row => {
                const [year, total, newbies, percent, avgAge] = row.split(',');
                return {
                    year: year.trim(),
                    avgAge: parseFloat(avgAge),
                    newbies: parseInt(newbies)
                };
            })
            .filter(item => item.year && !isNaN(item.avgAge));

        return data.sort((a, b) => a.year - b.year);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return null;
    }
}

async function updateChart() {
    const category = document.getElementById('categorySelect').value;
    const discipline = document.getElementById('disciplineSelect').value;
    
    const data = await loadData(category, discipline);
    if (!data) return;

    if (chartInstance) chartInstance.destroy();
    
    chartInstance = initializeChart();
    chartInstance.data = {
        labels: data.map(d => d.year),
        datasets: [{
            label: `Средний возраст (${config.categories[`${category}_${discipline}`})`,
            data: data.map(d => d.avgAge),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 6,
            pointHoverRadius: 8,
            fill: true
        }]
    };
    
    chartInstance.update();
}

// Инициализация
document.getElementById('categorySelect').addEventListener('change', updateChart);
document.getElementById('disciplineSelect').addEventListener('change', updateChart);
updateChart();