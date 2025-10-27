// src/income/income-categories.js
import { CustomHttp } from "@/services/custom-http.js";
import config from "../../config/config.js";
import { IncomeCategoryDelete } from "./income-category-delete.js";

console.log('%c✅ income-categories.js подключён!', 'color: green; font-weight: bold;');

export class IncomeCategoriesPage {
    constructor(router, type) {
        this.router = router;
        this.type = type;

        this.container = document.getElementById('income-categories-container');

        // Определяем тип: income или expense из query
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.type = params.get('type') || 'income'; // по умолчанию доходы

        // Обновляем заголовок страницы
        const titleEl = document.getElementById('category');
        if (titleEl) {
            titleEl.textContent = this.type === 'income' ? 'Доходы' : 'Расходы';
        }

        // Инициализация модуля удаления
        this.deleter = new IncomeCategoryDelete(
            'confirmModal',
            'confirmDeleteBtn',
            (deletedId) => this.removeCategoryFromUI(deletedId)
        );

        this.init();
    }

    async init() {
        await this.loadCategories();
    }

    async loadCategories() {
        try {
            // Читаем категории из localStorage по типу
            const key = this.type === 'income' ? 'incomeCategories' : 'expenseCategories';
            const stored = JSON.parse(localStorage.getItem(key));

            this.categories = stored && stored.length
                ? stored
                : this.getDefaultCategories();

            this.renderCategories(this.categories);
        } catch (err) {
            console.error('Ошибка при загрузке категорий:', err);
        }
    }

    getDefaultCategories() {
        return this.type === 'income'
            ? [
                { id: 1, title: 'Зарплата' },
                { id: 2, title: 'Фриланс' },
                { id: 3, title: 'Инвестиции' }
            ]
            : [
                { id: 1, title: 'Продукты' },
                { id: 2, title: 'Транспорт' },
                { id: 3, title: 'Развлечения' }
            ];
    }

    renderCategories(categories) {
        if (!this.container) return;
        this.container.innerHTML = '';

        categories.forEach(cat => {
            const col = document.createElement('div');
            col.className = 'card-custom';
            col.dataset.id = cat.id;

            col.innerHTML = `
                <div class="card p-7 shadow-sm" style="width: 352px;">
                    <h5 class="card-title">${cat.title}</h5>
                    <div class="d-flex mt-13">
                        <button class="btn btn-sm btn-primary me-13 edit-btn px-3 py-10" data-id="${cat.id}">Редактировать</button>
                        <button class="btn btn-sm btn-danger delete-btn px-3 py-10" data-id="${cat.id}">Удалить</button>
                    </div>
                </div>
            `;

            this.container.appendChild(col);
        });

        // Карточка "Создать"
        const addCol = document.createElement('div');
        addCol.className = 'card-custom';
        addCol.innerHTML = `
            <div class="card justify-content-center align-items-center border-dashed shadow-sm"
                 style="cursor: pointer; width: 352px; height: 135px;">
                <div class="fs-1 text-body-tertiary">+</div>
            </div>`;

        this.container.appendChild(addCol);

        // Обработчики кнопок
        this.container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.dataset.id;
                this.router.navigate(`#/dashboard/category-edit?type=${this.type}&id=${id}`);
            });
        });

        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.dataset.id;
                this.deleter.open(id, this.type); // передаем тип в модуль удаления
            });
        });

        addCol.addEventListener('click', () => {
            this.router.navigate(`#/dashboard/category-form?type=${this.type}`);
        });
    }

    removeCategoryFromUI(deletedId) {
        console.log(`🗑 Удаляем категорию с ID ${deletedId} из UI...`);

        // Удаляем из массива и localStorage
        const key = this.type === 'income' ? 'incomeCategories' : 'expenseCategories';
        this.categories = this.categories.filter(cat => cat.id != deletedId);
        localStorage.setItem(key, JSON.stringify(this.categories));

        // Удаляем элемент из DOM
        const item = this.container.querySelector(`[data-id="${deletedId}"]`);
        if (item) item.remove();

        console.log(`✅ Категория ${deletedId} успешно удалена`);
    }
}




