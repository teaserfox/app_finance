import { CustomHttp } from "@/services/custom-http";
import { navigate } from "@/router";
import config from "@/config/config";
import { BalanceUI } from "@/js/balance";
import * as bootstrap from "bootstrap";
import {Operation} from "@/types/operation.type";
import {CategoryType} from "@/types/category.type";
import {HttpErrorType} from "@/types/http-error.type";

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
            console.log("📥 Загружаем ВСЕ операции с бэка…");

            // Всегда грузим всё
            const response = await CustomHttp.request<Operation[] | { error: boolean; message: string }>
            (
                `${config.host}/operations?period=all`
            );


            if ((response as any).error) {
                throw new Error((response as any).message || 'Ошибка загрузки операций');
            }

            // Все операции пользователя
            const allOps = response as Operation[];

            // Парсим дату
            this.operations = allOps.map((op: Operation) => ({
                ...op,
                __parsedDate: new Date(op.date)
            }));

            let filtered: Operation[] = this.operations.slice();

            // ---- ФРОНТОВАЯ фильтрация ----

            const now = new Date();

            if (period === "today") {
                filtered = filtered.filter(op =>
                    op.__parsedDate?.toDateString() === now.toDateString()
                );
            }

            if (period === "week") {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                filtered = filtered.filter((op: Operation): boolean =>
                    op.__parsedDate! >= weekAgo
                );
            }

            if (period === "month") {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                filtered = filtered.filter((op: Operation): boolean =>
                    op.__parsedDate! >= firstDay
                );
            }

            if (period === "year") {
                const firstDay = new Date(now.getFullYear(), 0, 1);
                filtered = filtered.filter((op: Operation): boolean =>
                    op.__parsedDate! >= firstDay
                );
            }

            if (period === "interval" && dateFrom && dateTo) {
                const dFrom = new Date(dateFrom);
                const dTo = new Date(dateTo);
                filtered = filtered.filter((op: Operation): boolean =>
                    op.__parsedDate! >= dFrom && op.__parsedDate! <= dTo
                );
            }

            // ---- конец фильтра ----

            const sorted: Operation[] = filtered.sort((a: Operation, b: Operation): number =>
                (b.__parsedDate?.getTime() || 0) - (a.__parsedDate?.getTime() || 0)
            );

            this.renderOperations(sorted);

        } catch (err: any) {
            console.error('❌ Ошибка при загрузке операций:', err.message);
            alert('Ошибка при загрузке операций');
        }
    }


    private renderOperations(ops: Operation[] | null = null): void {
        if (!this.tableBody) return;
        const list: Operation[] = ops ?? this.operations;

        this.tableBody.innerHTML = '';
        if (!list.length) {
            const trEmpty: HTMLTableRowElement = document.createElement('tr');
            trEmpty.innerHTML = `<td colspan="7" class="text-center text-muted py-4">Нет операций за выбранный период</td>`;
            this.tableBody.appendChild(trEmpty);
            return;
        }

        list.forEach((op: Operation, index: number): void => {
            const tr: HTMLTableRowElement = document.createElement('tr');
            const displayDate: string = op.__parsedDate ? op.__parsedDate.toLocaleDateString() : (op.date || '');
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
        this.createIncomeBtn?.addEventListener('click', (): void => navigate('#/dashboard/operation-form?type=income'));
        this.createExpenseBtn?.addEventListener('click', (): void => navigate('#/dashboard/operation-form?type=expense'));

        this.filterButtons.forEach((btn: HTMLButtonElement): void => {
            btn.addEventListener('click', async (e: PointerEvent): Promise<void> => {
                this.filterButtons.forEach((b: HTMLButtonElement): void => b.classList.remove('active-filter'));
                const target = e.currentTarget as HTMLButtonElement;
                target.classList.add('active-filter');

                const rawText: string = (target.dataset.period || target.textContent || '').trim().toLowerCase();
                const backendPeriod: string = this._mapKeyToBackendPeriod(this._mapButtonTextToKey(rawText));

                if (backendPeriod === 'interval') {
                    const dateFromInput = document.getElementById('dateFrom') as HTMLInputElement | null;
                    const dateToInput = document.getElementById('dateTo') as HTMLInputElement | null;
                    const dateFrom: string | undefined = dateFromInput?.value;
                    const dateTo: string | undefined = dateToInput?.value;

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

        function checkIntervalDates(): void {
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
                const id: string | undefined = (e.currentTarget as HTMLButtonElement).dataset.id;
                if (id) navigate(`#/dashboard/operation-form?id=${id}`);
            });
        });

        this.tableBody?.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id: string | undefined = (e.currentTarget as HTMLButtonElement).dataset.id;
                if (id) this.handleDelete(id);
            });
        });
    }

    public async handleDelete(id: string): Promise<void> {
        const confirmModalEl: HTMLElement | null = document.getElementById('confirmModal');
        const confirmDeleteBtn: HTMLElement | null = document.getElementById('confirmDeleteBtn');

        if (!confirmModalEl || !confirmDeleteBtn) return alert('Модальное окно не найдено');

        const modal = new bootstrap.Modal(confirmModalEl);
        return new Promise((resolve, reject) => {
            modal.show();
            const confirmHandler = async () => {
                try {
                    await CustomHttp.request(`${config.host}/operations/${id}`, 'DELETE');
                    this.operations = this.operations.filter((op: Operation): boolean => op.id.toString() !== id);
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
            const incomeOption: HTMLOptionElement = document.createElement('option');
            incomeOption.value = 'income';
            incomeOption.textContent = 'Доход';
            const expenseOption: HTMLOptionElement = document.createElement('option');
            expenseOption.value = 'expense';
            expenseOption.textContent = 'Расход';
            this.typeInput.appendChild(incomeOption);
            this.typeInput.appendChild(expenseOption);

            const resolvedType: string = this.type || 'income';
            this.typeInput.value = resolvedType;

            await this.loadCategories(resolvedType);

            this.typeInput.addEventListener('change', async (e): Promise<void> => {
                const selectedType: string = (e.target as HTMLSelectElement).value;
                await this.loadCategories(selectedType);
            });
        }

        if (this.id) await this.loadOperationData();

        this.cancelBtn?.addEventListener('click', (): void => navigate('#/dashboard/operations'));
        this.operationForm?.addEventListener('submit', (e): void => {
            e.preventDefault();
            this.submitForm();
        });
    }

    public async loadCategories(typeParam?: string): Promise<void> {
        const type: string = typeParam || this.typeInput?.value || this.type || 'income';

        try {
            const response: HttpErrorType | CategoryType[] = await CustomHttp.request<CategoryType[] | HttpErrorType>(`${config.host}/categories/${type}`);

            if ('error' in response && response.error) {
                throw new Error(response.message || 'Ошибка загрузки категорий');
            }

            const categories = response as CategoryType[];
            this.categorySelect!.innerHTML = '';

            categories.forEach((cat: CategoryType): void => {
                const option: HTMLOptionElement = document.createElement('option');
                option.value = String(cat.id); // string обязателен
                option.textContent = cat.title;
                this.categorySelect!.appendChild(option);
            });
        } catch (err: unknown) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('Ошибка загрузки категорий:', msg);
            alert('Не удалось загрузить категории');
        }
    }


    public async loadOperationData(): Promise<void> {
        if (!this.id) return;

        try {
            const op: Operation | HttpErrorType =
                await CustomHttp.request<Operation | HttpErrorType>(`${config.host}/operations/${this.id}`);

            if ('error' in op && op.error) {
                throw new Error(op.message || 'Ошибка загрузки операции');
            }

            const operation = op as Operation;
            if (this.amountInput) this.amountInput.value = operation.amount.toString();
            if (this.commentInput) this.commentInput.value = operation.comment || '';
            if (this.dateInput) this.dateInput.value = operation.date?.split('T')[0] || '';
            this.type = operation.type;
            if (this.typeInput) this.typeInput.value = this.type;

            await this.loadCategories(this.type);
            if (this.categorySelect) this.categorySelect.value = operation.category_id?.toString() || '';

        } catch (err: unknown) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('Ошибка загрузки данных операции:', msg);
            alert('Не удалось загрузить данные операции');
        }
    }


    public async submitForm(): Promise<void> {
        if (!this.typeInput || !this.categorySelect || !this.amountInput || !this.dateInput) return;

        const data = {
            type: this.typeInput.value,
            category_id: Number(this.categorySelect.value),
            amount: Number(this.amountInput.value),
            date: this.dateInput.value,
            comment: this.commentInput?.value?.trim() || ''
        };

        try {
            const result: HttpErrorType | null = this.id
                ? await CustomHttp.request<null | HttpErrorType>(`${config.host}/operations/${this.id}`, 'PUT', data)
                : await CustomHttp.request<null | HttpErrorType>(`${config.host}/operations`, 'POST', data);

            if (result && 'error' in result && result.error) {
                throw new Error(result.message || 'Ошибка при сохранении операции');
            }

            if ((window as { balanceUI?: BalanceUI }).balanceUI) {
                await (window as { balanceUI?: BalanceUI }).balanceUI!.updateUserBalance();
            }

            navigate('#/dashboard/operations');

        } catch (err: unknown) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('Ошибка при сохранении операции:', msg);
            alert('Не удалось сохранить операцию');
        }
    }


    private _mapButtonTextToKey(text: string): string {
        const t: string = text.trim().toLowerCase();
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










