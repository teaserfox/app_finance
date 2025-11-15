import { Chart } from 'chart.js/auto';
import { OperationsService } from '@/services/operations-service';
import type {Operation, Operation as OperationType} from '@/types/operation.type';
import {navigate} from "@/router";
import {PeriodKeyType} from "@/types/period-key.type"; // импортируем правильный тип

export class IndexPage {
    private incomeCanvas: HTMLCanvasElement | null;
    private expenseCanvas: HTMLCanvasElement | null;
    private filterButtons: NodeListOf<HTMLButtonElement>;
    private dateFromInput: HTMLInputElement;
    private dateToInput: HTMLInputElement;

    private incomeChart: Chart | null;
    private expenseChart: Chart | null;

    constructor(router: typeof navigate) {
        this.incomeCanvas = document.getElementById('incomeChart') as HTMLCanvasElement | null;
        this.expenseCanvas = document.getElementById('expenseChart') as HTMLCanvasElement | null;

        this.filterButtons = document.querySelectorAll('.btn-filter') as NodeListOf<HTMLButtonElement>;
        this.dateFromInput = document.querySelector('input[type="date"]:first-of-type') as HTMLInputElement;
        this.dateToInput = document.querySelector('input[type="date"]:last-of-type') as HTMLInputElement;

        this.incomeChart = null;
        this.expenseChart = null;

        this.init();
    }

    private init(): void {
        if (!this.incomeCanvas || !this.expenseCanvas) {
            console.warn('⚠️ Canvas для графиков не найден');
            return;
        }

        this.filterButtons.forEach((btn: HTMLButtonElement): void => {
            btn.addEventListener('click', async (e: PointerEvent): Promise<void> => {
                this.filterButtons.forEach((b: HTMLButtonElement): void => b.classList.remove('active-filter'));
                const target = e.currentTarget as HTMLButtonElement;
                target.classList.add('active-filter');

                const periodText: string = target.textContent?.trim().toLowerCase() || '';
                const period: PeriodKeyType = this._mapButtonTextToKey(periodText);

                let dateFrom: string | null = null;
                let dateTo: string | null = null;
                if (period === 'interval') {
                    dateFrom = this.dateFromInput.value || null;
                    dateTo = this.dateToInput.value || null;
                    if (!dateFrom || !dateTo) return alert('Выберите обе даты для интервала');
                }

                const ops: OperationType[] = await OperationsService.load(period, dateFrom, dateTo);
                this.renderCharts(ops);
            });
        });

        [this.dateFromInput, this.dateToInput].forEach((input: HTMLInputElement): void => {
            input.addEventListener('input', (): void => {
                const activeBtn: HTMLButtonElement | undefined = Array.from(this.filterButtons).find((b: HTMLButtonElement): boolean => b.classList.contains('active-filter'));
                if (activeBtn && activeBtn.textContent?.toLowerCase().includes('интервал')) {
                    activeBtn.click();
                }
            });
        });

        const defaultBtn: HTMLButtonElement | undefined = Array.from(this.filterButtons).find((b: HTMLButtonElement): boolean => b.textContent?.toLowerCase().includes('сегодня'));
        if (defaultBtn) defaultBtn.click();
    }

    private renderCharts(ops: OperationType[]): void {
        const incomeData: Record<string, number> = {};
        const expenseData: Record<string, number> = {};

        ops.forEach((op: Operation): void => {
            const category: string = op.category || 'Без категории';
            if (op.type === 'income') incomeData[category] = (incomeData[category] || 0) + op.amount;
            else if (op.type === 'expense') expenseData[category] = (expenseData[category] || 0) + op.amount;
        });

        if (this.incomeCanvas) this.renderChart(this.incomeCanvas, incomeData, 'Доходы');
        if (this.expenseCanvas) this.renderChart(this.expenseCanvas, expenseData, 'Расходы');
    }

    private renderChart(canvas: HTMLCanvasElement, dataObj: Record<string, number>, label: string): void {
        const labels: string[] = Object.keys(dataObj);
        const data: number[] = Object.values(dataObj);
        const backgroundColor: string[] = ['#dc3545','#fd7e14','#ffc107','#20C997','#0d6efd'];

        // @ts-ignore
        if (canvas.chartInstance) canvas.chartInstance.destroy();

        // @ts-ignore
        canvas.chartInstance = new Chart(canvas.getContext('2d')!, {
            type: 'pie',
            data: { labels, datasets: [{ label, data, backgroundColor }] },
            options: { responsive: true }
        });
    }

    private _mapButtonTextToKey(text: string): PeriodKeyType {
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







