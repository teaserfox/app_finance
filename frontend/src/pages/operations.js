// src/pages/operations.js
import { CustomHttp } from "@/services/custom-http.js";
import { navigate } from "@/router.js";
import config from "../../config/config.js";
import { BalanceUI } from "@/js/balance.js";

console.log('%c✅ operations.js подключён!', 'color: green; font-weight: bold;');

export class OperationsPage {
    constructor(router) {
        this.router = router;

        // таблица операций
        this.tableBody = document.querySelector('tbody');
        this.createIncomeBtn = document.querySelector('.btn-success.btn-category');
        this.createExpenseBtn = document.querySelector('.btn-danger.btn-category');
        this.filterButtons = document.querySelectorAll('.btn-filter');

        // форма создания/редактирования операции
        this.typeInput = document.getElementById('type');
        this.operationForm = document.getElementById('operationForm');
        this.amountInput = document.getElementById('amount');
        this.categorySelect = document.getElementById('category');
        this.dateInput = document.getElementById('date');
        this.commentInput = document.getElementById('comment');
        this.formTitle = document.getElementById('form-title');
        this.cancelBtn = document.getElementById('cancelBtn');

        // определяем тип и id из URL
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        this.type = urlParams.get('type'); // income | expense
        this.id = urlParams.get('id');

        if (this.typeInput) this.typeInput.value = this.type;

        this.operations = [];

        if (document.querySelector('#balance')) {
            window.balanceUI = window.balanceUI || new BalanceUI();
        }

        this.init();
    }

    async init() {
        if (this.operationForm) {
            await this.initForm();
        } else {
            this.addEventListeners();

            const activeFilterBtn = document.querySelector('.btn-filter.active-filter');
            const defaultFilter = activeFilterBtn ? activeFilterBtn.textContent.toLowerCase() : 'сегодня';
            await this.loadOperations(defaultFilter);
        }
    }

    // === 🧾 ЗАГРУЗКА ОПЕРАЦИЙ ===
    async loadOperations(period = 'all') {
        try {
            const response = await CustomHttp.request(`${config.host}/operations?period=${period}`);
            if (!response || response.error) throw new Error(response?.message || 'Ошибка загрузки операций');

            this.operations = response.map(op => Object.assign({}, op, { __parsedDate: new Date(op.date) }));

            const sorted = this.operations.slice().sort((a, b) => b.__parsedDate - a.__parsedDate);
            this.renderOperations(sorted);
        } catch (err) {
            console.error('❌ Ошибка при загрузке операций:', err.message);
            alert('Ошибка при загрузке операций');
        }
    }

    renderOperations(ops = null) {
        if (!this.tableBody) return;
        const list = Array.isArray(ops) ? ops : this.operations;
        this.tableBody.innerHTML = '';

        if (!list || list.length === 0) {
            const trEmpty = document.createElement('tr');
            trEmpty.innerHTML = `
                <td colspan="7" class="text-center text-muted py-4">Нет операций за выбранный период</td>
            `;
            this.tableBody.appendChild(trEmpty);
            return;
        }

        list.forEach((op, index) => {
            const tr = document.createElement('tr');
            const displayDate = op.__parsedDate instanceof Date && !isNaN(op.__parsedDate)
                ? op.__parsedDate.toLocaleDateString()
                : (op.date || '');
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
            this.tableBody.appendChild(tr);
        });

        this.addRowEventListeners();
    }

    addEventListeners() {
        if (this.createIncomeBtn) {
            this.createIncomeBtn.addEventListener('click', () => navigate('#/dashboard/operation-form?type=income'));
        }

        if (this.createExpenseBtn) {
            this.createExpenseBtn.addEventListener('click', () => navigate('#/dashboard/operation-form?type=expense'));
        }

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active-filter'));
                e.target.classList.add('active-filter');

                const rawText = (e.target.dataset.period || e.target.textContent || '').trim().toLowerCase();
                const periodKey = this._mapButtonTextToKey(rawText);
                const backendPeriod = this._mapKeyToBackendPeriod(periodKey);
                await this.loadOperations(backendPeriod);
            });
        });
    }

    addRowEventListeners() {
        this.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                navigate(`#/dashboard/operation-form?id=${id}`);
            });
        });

        this.tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                this.handleDelete(id);
            });
        });
    }

    async handleDelete(id) {
        const confirmModalEl = document.getElementById('confirmModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (!confirmModalEl || !confirmDeleteBtn) {
            alert('Модальное окно не найдено');
            return;
        }

        const modal = new bootstrap.Modal(confirmModalEl);

        return new Promise((resolve, reject) => {
            modal.show();

            const confirmHandler = async () => {
                try {
                    await CustomHttp.request(`${config.host}/operations/${id}`, 'DELETE');
                    this.operations = this.operations.filter(op => op.id != id);
                    this.renderOperations();
                    if (window.balanceUI) window.balanceUI.updateUserBalance();
                    resolve();
                } catch (err) {
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

    // === ✏️ СОЗДАНИЕ / РЕДАКТИРОВАНИЕ ОПЕРАЦИЙ ===
    async initForm() {
        if (this.formTitle) {
            this.formTitle.textContent = this.id
                ? 'Редактирование операции'
                : this.type === 'income'
                    ? 'Создание дохода'
                    : 'Создание расхода';
        }

        // === 🟢 Тип операции ===
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

            // сразу загрузим категории для текущего типа
            await this.loadCategories(resolvedType);

            // добавляем реакцию на смену типа
            this.typeInput.addEventListener('change', async (e) => {
                const selectedType = e.target.value;
                await this.loadCategories(selectedType);
            });
        }

        // если редактируем — подгружаем данные
        if (this.id) {
            await this.loadOperationData();
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => navigate('#/dashboard/operations'));
        }

        if (this.operationForm) {
            this.operationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }

    // === ЗАГРУЗКА КАТЕГОРИЙ ===
    async loadCategories(typeParam) {
        try {
            const type = typeParam || (this.typeInput ? this.typeInput.value : (this.type || 'income'));
            const response = await CustomHttp.request(`${config.host}/categories/${type}`);
            if (!response || response.error) throw new Error(response?.message || 'Ошибка загрузки категорий');

            this.categorySelect.innerHTML = '';
            response.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.title;
                this.categorySelect.appendChild(option);
            });
        } catch (err) {
            console.error('Ошибка загрузки категорий:', err.message);
            alert('Не удалось загрузить категории');
        }
    }

    async loadOperationData() {
        try {
            const op = await CustomHttp.request(`${config.host}/operations/${this.id}`);
            if (!op || op.error) throw new Error(op?.message || 'Ошибка загрузки операции');

            this.amountInput.value = op.amount;
            this.commentInput.value = op.comment || '';
            this.dateInput.value = (op.date || '').split('T')[0] || '';
            this.type = op.type;
            if (this.typeInput) this.typeInput.value = this.type;
            await this.loadCategories(this.type);
            this.categorySelect.value = op.category_id || '';
        } catch (err) {
            console.error('Ошибка загрузки данных операции:', err.message);
            alert('Не удалось загрузить данные операции');
        }
    }

    async submitForm() {
        const data = {
            type: this.typeInput ? this.typeInput.value : (this.type || 'income'),
            category_id: Number(this.categorySelect.value),
            amount: Number(this.amountInput.value),
            date: this.dateInput.value,
            comment: (this.commentInput && this.commentInput.value) ? this.commentInput.value.trim() : ''
        };

        try {
            let result;
            if (this.id) {
                result = await CustomHttp.request(`${config.host}/operations/${this.id}`, 'PUT', data);
            } else {
                result = await CustomHttp.request(`${config.host}/operations`, 'POST', data);
            }

            if (result && !result.error) {
                console.log('✅ Операция успешно сохранена:', result);
                if (window.balanceUI) await window.balanceUI.updateUserBalance();
                navigate('#/dashboard/operations');
            } else {
                throw new Error(result?.message || 'Ошибка при сохранении операции');
            }
        } catch (error) {
            console.error('❌ Ошибка при сохранении операции:', error.message);
            alert('Не удалось сохранить операцию');
        }
    }

    // === ВСПОМОГАТЕЛЬНЫЕ ===
    _mapButtonTextToKey(text) {
        if (!text) return 'all';
        const t = text.trim().toLowerCase();
        if (t.includes('сегодня') || t === 'today') return 'today';
        if (t.includes('недел') || t === 'week') return 'week';
        if (t.includes('месяц') || t === 'month') return 'month';
        if (t.includes('год') || t === 'year') return 'year';
        if (t.includes('все') || t === 'all') return 'all';
        return 'all';
    }

    _mapKeyToBackendPeriod(key) {
        switch (key) {
            case 'today': return 'today';
            case 'week': return 'week';
            case 'month': return 'month';
            case 'year': return 'year';
            case 'all': return 'all';
            default: return 'all';
        }
    }
}









