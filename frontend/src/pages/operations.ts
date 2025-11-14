import { CustomHttp } from "@/services/custom-http";
import { navigate } from "@/router";
import config from "@/config/config";
import { BalanceUI } from "@/js/balance";
import * as bootstrap from "bootstrap";

interface Operation {
    id: number;
    type: 'income' | 'expense';
    category: string;
    category_id?: number;
    amount: number;
    date: string;
    comment?: string;
    __parsedDate?: Date;
    error?: boolean;
    message?: string;
}

interface Category {
    id: string;
    title: string;
    error?: boolean;
    message?: string;
}

export class OperationsPage {
    private router: typeof navigate;

    private tableBody: HTMLTableSectionElement | null;
    private createIncomeBtn: HTMLButtonElement | null;
    private createExpenseBtn: HTMLButtonElement | null;
    private filterButtons: NodeListOf<HTMLButtonElement>;

    private typeInput: HTMLSelectElement | null;
    private operationForm: HTMLFormElement | null;
    private amountInput: HTMLInputElement | null;
    private categorySelect: HTMLSelectElement | null;
    private dateInput: HTMLInputElement | null;
    private commentInput: HTMLInputElement | null;
    private formTitle: HTMLElement | null;
    private cancelBtn: HTMLButtonElement | null;

    private type: string | null;
    private id: string | null;
    private operations: Operation[];

    constructor(router: typeof navigate) {
        this.router = router;

        this.tableBody = document.querySelector('tbody');
        this.createIncomeBtn = document.querySelector('.btn-success.btn-category');
        this.createExpenseBtn = document.querySelector('.btn-danger.btn-category');
        this.filterButtons = document.querySelectorAll('.btn-filter');

        this.typeInput = document.getElementById('type') as HTMLSelectElement | null;
        this.operationForm = document.getElementById('operationForm') as HTMLFormElement | null;
        this.amountInput = document.getElementById('amount') as HTMLInputElement | null;
        this.categorySelect = document.getElementById('category') as HTMLSelectElement | null;
        this.dateInput = document.getElementById('date') as HTMLInputElement | null;
        this.commentInput = document.getElementById('comment') as HTMLInputElement | null;
        this.formTitle = document.getElementById('form-title');
        this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement | null;

        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        this.type = urlParams.get('type');
        this.id = urlParams.get('id');

        if (this.typeInput) this.typeInput.value = this.type || 'income';
        this.operations = [];

        if (document.querySelector('#balance')) {
            (window as any).balanceUI = (window as any).balanceUI || new BalanceUI();
        }

        this.init();
    }

    public async init(): Promise<void> {
        if (this.operationForm) {
            await this.initForm();
        } else {
            this.addEventListeners();
            const activeFilterBtn = document.querySelector('.btn-filter.active-filter') as HTMLButtonElement | null;
            const defaultFilter = activeFilterBtn?.textContent?.toLowerCase() || 'сегодня';
            await this.loadOperations(defaultFilter);
        }
    }

    public async loadOperations(period: string = 'all', dateFrom: string | null = null, dateTo: string | null = null): Promise<void> {
        try {
            let url = `${config.host}/operations?period=${period}`;
            if (period === 'interval' && dateFrom && dateTo) {
                url += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
            }

            const response = await CustomHttp.request(url) as Operation[] | { error: boolean; message: string };
            if ((response as any).error) throw new Error((response as any).message || 'Ошибка загрузки операций');

            const ops = response as Operation[];
            this.operations = ops.map(op => ({ ...op, __parsedDate: new Date(op.date) }));

            const sorted = this.operations.slice().sort((a, b) => (b.__parsedDate?.getTime() || 0) - (a.__parsedDate?.getTime() || 0));
            this.renderOperations(sorted);
        } catch (err: any) {
            console.error('❌ Ошибка при загрузке операций:', err.message);
            alert('Ошибка при загрузке операций');
        }
    }

    private renderOperations(ops: Operation[] | null = null): void {
        if (!this.tableBody) return;
        const list = ops ?? this.operations;

        this.tableBody.innerHTML = '';
        if (!list.length) {
            const trEmpty = document.createElement('tr');
            trEmpty.innerHTML = `<td colspan="7" class="text-center text-muted py-4">Нет операций за выбранный период</td>`;
            this.tableBody.appendChild(trEmpty);
            return;
        }

        list.forEach((op, index) => {
            const tr = document.createElement('tr');
            const displayDate = op.__parsedDate ? op.__parsedDate.toLocaleDateString() : (op.date || '');
            tr.innerHTML = `
                <td class="td-title p-0">${index + 1}</td>
                <td class="${op.type === 'income' ? 'text-income' : 'text-expense'}">${op.type === 'income' ? 'доход' : 'расход'}</td>
                <td class="td-text">${op.category}</td>
                <td class="td-text">${op.amount}$</td>
                <td class="td-text">${displayDate}</td>
                <td class="td-text">${op.comment || ''}</td>
                <td class="td-btn">
                    <button class="btn delete-btn" data-id="${op.id}">🗑️</button>
                    <button class="btn edit-btn" data-id="${op.id}">✏️</button>
                </td>
            `;
            if (this.tableBody) {
                this.tableBody.appendChild(tr);
            }
        });

        this.addRowEventListeners();
    }

    private addEventListeners(): void {
        this.createIncomeBtn?.addEventListener('click', () => navigate('#/dashboard/operation-form?type=income'));
        this.createExpenseBtn?.addEventListener('click', () => navigate('#/dashboard/operation-form?type=expense'));

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active-filter'));
                const target = e.currentTarget as HTMLButtonElement;
                target.classList.add('active-filter');

                const rawText = (target.dataset.period || target.textContent || '').trim().toLowerCase();
                const backendPeriod = this._mapKeyToBackendPeriod(this._mapButtonTextToKey(rawText));

                if (backendPeriod === 'interval') {
                    const dateFromInput = document.getElementById('dateFrom') as HTMLInputElement | null;
                    const dateToInput = document.getElementById('dateTo') as HTMLInputElement | null;
                    const dateFrom = dateFromInput?.value;
                    const dateTo = dateToInput?.value;

                    if (!dateFrom || !dateTo) return alert('Выберите обе даты для интервала');

                    await this.loadOperations(backendPeriod, dateFrom, dateTo);
                } else {
                    await this.loadOperations(backendPeriod);
                }
            });
        });

        const dateFromInput = document.getElementById('dateFrom') as HTMLInputElement | null;
        const dateToInput = document.getElementById('dateTo') as HTMLInputElement | null;
        const intervalBtn = document.querySelector('button[data-period="interval"]') as HTMLButtonElement | null;

        function checkIntervalDates() {
            if (!dateFromInput || !dateToInput || !intervalBtn) return;
            if (dateFromInput.value && dateToInput.value) {
                intervalBtn.disabled = false;
                intervalBtn.classList.remove('disabled');
            } else {
                intervalBtn.disabled = true;
                intervalBtn.classList.add('disabled');
            }
        }

        dateFromInput?.addEventListener('input', checkIntervalDates);
        dateToInput?.addEventListener('input', checkIntervalDates);
        checkIntervalDates();
    }

    private addRowEventListeners(): void {
        this.tableBody?.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = (e.currentTarget as HTMLButtonElement).dataset.id;
                if (id) navigate(`#/dashboard/operation-form?id=${id}`);
            });
        });

        this.tableBody?.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = (e.currentTarget as HTMLButtonElement).dataset.id;
                if (id) this.handleDelete(id);
            });
        });
    }

    public async handleDelete(id: string): Promise<void> {
        const confirmModalEl = document.getElementById('confirmModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (!confirmModalEl || !confirmDeleteBtn) return alert('Модальное окно не найдено');

        const modal = new bootstrap.Modal(confirmModalEl);
        return new Promise((resolve, reject) => {
            modal.show();
            const confirmHandler = async () => {
                try {
                    await CustomHttp.request(`${config.host}/operations/${id}`, 'DELETE');
                    this.operations = this.operations.filter(op => op.id.toString() !== id);
                    this.renderOperations();
                    if ((window as any).balanceUI) await (window as any).balanceUI.updateUserBalance();
                    resolve();
                } catch (err: any) {
                    console.error('Ошибка при удалении операции:', err.message);
                    alert('Не удалось удалить операцию');
                    reject(err);
                } finally {
                    modal.hide();
                    confirmDeleteBtn.removeEventListener('click', confirmHandler);
                }
            };
            confirmDeleteBtn.addEventListener('click', confirmHandler);
        });
    }

    public async initForm(): Promise<void> {
        if (this.formTitle) {
            this.formTitle.textContent = this.id
                ? 'Редактирование операции'
                : this.type === 'income'
                    ? 'Создание дохода'
                    : 'Создание расхода';
        }

        if (this.typeInput) {
            this.typeInput.innerHTML = '';
            const incomeOption = document.createElement('option');
            incomeOption.value = 'income';
            incomeOption.textContent = 'Доход';
            const expenseOption = document.createElement('option');
            expenseOption.value = 'expense';
            expenseOption.textContent = 'Расход';
            this.typeInput.appendChild(incomeOption);
            this.typeInput.appendChild(expenseOption);

            const resolvedType = this.type || 'income';
            this.typeInput.value = resolvedType;

            await this.loadCategories(resolvedType);

            this.typeInput.addEventListener('change', async (e) => {
                const selectedType = (e.target as HTMLSelectElement).value;
                await this.loadCategories(selectedType);
            });
        }

        if (this.id) await this.loadOperationData();

        this.cancelBtn?.addEventListener('click', () => navigate('#/dashboard/operations'));
        this.operationForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
    }

    public async loadCategories(typeParam?: string): Promise<void> {
        try {
            const type = typeParam || this.typeInput?.value || this.type || 'income';
            const response = await CustomHttp.request(`${config.host}/categories/${type}`) as Category[] | { error: boolean; message: string };
            if ((response as any).error) throw new Error((response as any).message || 'Ошибка загрузки категорий');

            const categories = response as Category[];
            this.categorySelect!.innerHTML = '';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.title;
                this.categorySelect!.appendChild(option);
            });
        } catch (err: any) {
            console.error('Ошибка загрузки категорий:', err.message);
            alert('Не удалось загрузить категории');
        }
    }

    public async loadOperationData(): Promise<void> {
        try {
            const op = await CustomHttp.request(`${config.host}/operations/${this.id}`) as Operation | { error: boolean; message: string };
            if ((op as any).error) throw new Error((op as any).message || 'Ошибка загрузки операции');

            const operation = op as Operation;
            if (this.amountInput) this.amountInput.value = operation.amount.toString();
            if (this.commentInput) this.commentInput.value = operation.comment || '';
            if (this.dateInput) this.dateInput.value = (operation.date || '').split('T')[0] || '';
            this.type = operation.type;
            if (this.typeInput) this.typeInput.value = this.type;
            await this.loadCategories(this.type);
            if (this.categorySelect) this.categorySelect.value = operation.category_id?.toString() || '';
        } catch (err: any) {
            console.error('Ошибка загрузки данных операции:', err.message);
            alert('Не удалось загрузить данные операции');
        }
    }

    public async submitForm(): Promise<void> {
        const data = {
            type: this.typeInput?.value || this.type || 'income',
            category_id: Number(this.categorySelect?.value),
            amount: Number(this.amountInput?.value),
            date: this.dateInput?.value,
            comment: this.commentInput?.value?.trim() || ''
        };

        try {
            const result = this.id
                ? await CustomHttp.request(`${config.host}/operations/${this.id}`, 'PUT', data)
                : await CustomHttp.request(`${config.host}/operations`, 'POST', data);

            if (!(result as any).error) {
                console.log('✅ Операция успешно сохранена:', result);
                if ((window as any).balanceUI) await (window as any).balanceUI.updateUserBalance();
                navigate('#/dashboard/operations');
            } else {
                throw new Error((result as any).message || 'Ошибка при сохранении операции');
            }
        } catch (error: any) {
            console.error('❌ Ошибка при сохранении операции:', error.message);
            alert('Не удалось сохранить операцию');
        }
    }

    private _mapButtonTextToKey(text: string): string {
        const t = text.trim().toLowerCase();
        if (t.includes('сегодня') || t === 'today') return 'today';
        if (t.includes('неделя') || t === 'week') return 'week';
        if (t.includes('месяц') || t === 'month') return 'month';
        if (t.includes('год') || t === 'year') return 'year';
        if (t.includes('интервал') || t === 'interval') return 'interval';
        if (t.includes('все') || t === 'all') return 'all';
        return 'all';
    }

    private _mapKeyToBackendPeriod(key: string): string {
        switch (key) {
            case 'today': return 'today';
            case 'week': return 'week';
            case 'month': return 'month';
            case 'year': return 'year';
            case 'all': return 'all';
            case 'interval': return 'interval';
            default: return 'today';
        }
    }
}










