const config = {
    basePath: '../../stats/trends',
    colors: {
        longboard_men: '#2e86de',
        longboard_women: '#10ac84',
        shortboard_men: '#ff9f43',
        shortboard_women: '#ee5253'
    },
    chartConfig: {
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 6,
        fill: true,
        backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const {ctx: context, chartArea} = chart;
            if (!chartArea) return;

            const gradient = context.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, `${config.colors[currentCategory]}10`);
            gradient.addColorStop(1, `${config.colors[currentCategory]}03`);
            return gradient;
        }
    }
};

let chartInstance = null;
let currentCategory = 'longboard_men';

async function fetchData(boardType, gender) {
    const path = `${config.basePath}/general_${boardType}_${gender}_stats.csv`;
    try {
        const response = await fetch(path);
        const csvData = await response.text();
        return csvData.split('\n').slice(1)
            .map(row => {
                const [year, total, newbies, percent, avgAge] = row.split(',');
                return {
                    year: year.trim(),
                    avgAge: parseFloat(avgAge)
                };
            })
            .filter(item => item.year && !isNaN(item.avgAge))
            .sort((a, b) => a.year - b.year);
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

function updateChartConfig(data, category) {
    return {
        type: 'line',
        data: {
            labels: data.map(d => d.year),
            datasets: [{
                label: 'Average Age',
                data: data.map(d => d.avgAge),
                borderColor: config.colors[category],
                backgroundColor: (ctx) => config.chartConfig.backgroundColor(ctx),
                borderWidth: config.chartConfig.borderWidth,
                tension: config.chartConfig.tension,
                pointRadius: config.chartConfig.pointRadius,
                fill: config.chartConfig.fill
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    bodyColor: '#ffffff',
                    titleColor: '#dfe6e9',
                    borderColor: 'rgba(255,255,255,0.1)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: '#e9ecef' },
                    title: {
                        display: true,
                        text: 'Year',
                        color: '#7f8c8d'
                    }
                },
                y: {
                    grid: { color: '#e9ecef' },
                    title: {
                        display: true,
                        text: 'Average Age',
                        color: '#7f8c8d'
                    },
                    suggestedMin: 20,
                    suggestedMax: 40
                }
            }
        }
    };
}

async function updateChart() {
    const boardType = document.getElementById('boardType').value;
    const gender = document.getElementById('gender').value;
    currentCategory = `${boardType}_${gender}`;

    const data = await fetchData(boardType, gender);
    if (!data) return;

    document.getElementById('currentCategory').textContent =
        `${boardType.charAt(0).toUpperCase() + boardType.slice(1)} - ${gender.charAt(0).toUpperCase() + gender.slice(1)}`;

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('trendChart').getContext('2d');
    chartInstance = new Chart(ctx, updateChartConfig(data, currentCategory));
}

// Event Listeners
document.getElementById('boardType').addEventListener('change', updateChart);
document.getElementById('gender').addEventListener('change', updateChart);

// Initial load
updateChart();
