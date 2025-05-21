const config = {
    basePath: '../../stats/trends',
    colors: {
        age: '#2e86de',
        newAthletes: '#10ac84'
    },
    chartConfig: {
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 6,
        fill: true
    }
};

let chartInstance = null;

async function fetchData(boardType, gender) {
    const path = `${config.basePath}/general_${boardType}_${gender}_stats.csv`;
    try {
        const response = await fetch(path);
        const csvData = await response.text();
        return csvData.split('\n').slice(1)
            .map(row => {
                const [year, total, newAthletes, percent, avgAge] = row.split(',');
                return {
                    year: year.trim(),
                    avgAge: parseFloat(avgAge),
                    newAthletes: parseInt(newAthletes)
                };
            })
            .filter(item => item.year && !isNaN(item.avgAge))
            .sort((a, b) => a.year - b.year);
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

function createGradient(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}10`);
    return gradient;
}

function updateChartConfig(data) {
    return {
        type: 'line',
        data: {
            labels: data.map(d => d.year),
            datasets: [
                {
                    label: 'Средний возраст',
                    data: data.map(d => d.avgAge),
                    borderColor: config.colors.age,
                    backgroundColor: (ctx) => createGradient(ctx.chart.ctx, config.colors.age),
                    yAxisID: 'y',
                    ...config.chartConfig
                },
                {
                    label: 'Новые спортсмены',
                    data: data.map(d => d.newAthletes),
                    borderColor: config.colors.newAthletes,
                    backgroundColor: (ctx) => createGradient(ctx.chart.ctx, config.colors.newAthletes),
                    type: 'bar',
                    yAxisID: 'y1',
                    borderRadius: 4,
                    borderWidth: 0,
                    hoverBackgroundColor: config.colors.newAthletes
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#2c3e50',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    backgroundColor: '#ffffff',
                    titleColor: '#2c3e50',
                    bodyColor: '#2c3e50',
                    borderColor: '#e9ecef',
                    borderWidth: 1,
                    boxPadding: 6,
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return ` ${label}: ${value}${context.datasetIndex === 0 ? ' лет' : ' чел.'}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        color: '#e9ecef'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                },
                y: {
                    position: 'left',
                    grid: {
                        color: '#f1f3f5'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    },
                    title: {
                        display: true,
                        text: 'Средний возраст (лет)',
                        color: '#7f8c8d'
                    }
                },
                y1: {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: '#f1f3f5'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    },
                    title: {
                        display: true,
                        text: 'Новые спортсмены (чел.)',
                        color: '#7f8c8d'
                    }
                }
            }
        }
    };
}

async function updateChart() {
    const boardType = document.getElementById('boardType').value;
    const gender = document.getElementById('gender').value;

    const data = await fetchData(boardType, gender);
    if (!data) return;

    document.getElementById('currentCategory').textContent =
        `${boardType.charAt(0).toUpperCase() + boardType.slice(1)} - ${gender.charAt(0).toUpperCase() + gender.slice(1)}`;

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('trendChart').getContext('2d');
    chartInstance = new Chart(ctx, updateChartConfig(data));
}

// Инициализация событий
document.getElementById('boardType').addEventListener('change', updateChart);
document.getElementById('gender').addEventListener('change', updateChart);
updateChart();
