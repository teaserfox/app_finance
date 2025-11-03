import { Chart } from 'chart.js/auto';
import { OperationsService } from '@/services/operations-service.js';

// Chart.register(PieController, ArcElement, Tooltip, Legend);

export class IndexPage {
    constructor() {
        this.incomeCanvas = document.getElementById('incomeChart');
        this.expenseCanvas = document.getElementById('expenseChart');

        this.filterButtons = document.querySelectorAll('.btn-filter');
        this.dateFromInput = document.querySelector('input[type="date"]:first-of-type');
        this.dateToInput = document.querySelector('input[type="date"]:last-of-type');

        this.incomeChart = null;
        this.expenseChart = null;

        this.init();
    }

    init() {
        if (!this.incomeCanvas || !this.expenseCanvas) {
            console.warn('⚠️ Canvas для графиков не найден');
            return;
        }

        // 🔹 Навешиваем обработчики на кнопки фильтра
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active-filter'));
                e.target.classList.add('active-filter');

                const periodText = e.target.textContent.trim().toLowerCase();
                let period = this._mapButtonTextToKey(periodText);

                let dateFrom = null, dateTo = null;
                if (period === 'interval') {
                    dateFrom = this.dateFromInput.value;
                    dateTo = this.dateToInput.value;
                    if (!dateFrom || !dateTo) return alert('Выберите обе даты для интервала');
                }

                const ops = await OperationsService.load(period, dateFrom, dateTo);
                this.renderCharts(ops);
            });
        });

        // 🔹 Обработка изменения дат интервала
        const intervalInputs = [this.dateFromInput, this.dateToInput];
        intervalInputs.forEach(input => {
            input.addEventListener('input', () => {
                const activeBtn = Array.from(this.filterButtons).find(b => b.classList.contains('active-filter'));
                if (activeBtn && activeBtn.textContent.toLowerCase().includes('интервал')) {
                    activeBtn.click(); // перезагрузка диаграмм
                }
            });
        });

        // 🔹 Автозагрузка "Сегодня"
        const defaultBtn = Array.from(this.filterButtons).find(b => b.textContent.toLowerCase().includes('сегодня'));
        if (defaultBtn) defaultBtn.click();
    }

    renderCharts(ops) {
        const incomeData = {};
        const expenseData = {};

        ops.forEach(op => {
            if (op.type === 'income') incomeData[op.category] = (incomeData[op.category] || 0) + op.amount;
            else if (op.type === 'expense') expenseData[op.category] = (expenseData[op.category] || 0) + op.amount;
        });

        this.renderChart(this.incomeCanvas, incomeData, 'Доходы');
        this.renderChart(this.expenseCanvas, expenseData, 'Расходы');
    }

    renderChart(canvas, dataObj, label) {
        const labels = Object.keys(dataObj);
        const data = Object.values(dataObj);
        const backgroundColor = ['#dc3545','#fd7e14','#ffc107','#20C997','#0d6efd'];

        if (canvas.chartInstance) canvas.chartInstance.destroy();
        canvas.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'pie',
            data: { labels, datasets: [{ label, data, backgroundColor }] },
            options: { responsive: true }
        });
    }

    _mapButtonTextToKey(text) {
        text = text?.trim().toLowerCase();
        if (!text) return 'all';
        if (text.includes('сегодня')) return 'today';
        if (text.includes('неделя')) return 'week';
        if (text.includes('месяц')) return 'month';
        if (text.includes('год')) return 'year';
        if (text.includes('интервал')) return 'interval';
        if (text.includes('все')) return 'all';
        return 'all';
    }
}





