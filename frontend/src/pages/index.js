// src/pages/index.js
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

console.log('%c✅ index.js подключён!', 'color: green; font-weight: bold;');

// Регистрируем необходимые элементы Chart.js
Chart.register(PieController, ArcElement, Tooltip, Legend);

export class IndexPage {
    constructor(router) {
        this.router = router;
        this.initCharts();
    }

    initCharts() {
        const incomeCanvas = document.getElementById('incomeChart');
        const expenseCanvas = document.getElementById('expenseChart');

        if (!incomeCanvas || !expenseCanvas) {
            console.warn('⚠️ Canvas для графиков не найден');
            return;
        }

        const incomeCtx = incomeCanvas.getContext('2d');
        const expenseCtx = expenseCanvas.getContext('2d');

        const incomeData = {
            labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
            datasets: [{
                label: 'Доходы',
                data: [28, 40, 13, 12, 7],
                backgroundColor: ['#dc3545','#fd7e14','#ffc107','#20C997','#0d6efd']
            }]
        };

        const expenseData = {
            labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
            datasets: [{
                label: 'Расходы',
                data: [5, 12, 32, 30, 21],
                backgroundColor: ['#dc3545','#fd7e14','#ffc107','#20C997','#0d6efd']
            }]
        };

        new Chart(incomeCtx, {
            type: 'pie',
            data: incomeData,
            options: { responsive: true }
        });

        new Chart(expenseCtx, {
            type: 'pie',
            data: expenseData,
            options: { responsive: true }
        });
    }
}




