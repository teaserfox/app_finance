// src/income/income-category-form.js
import { navigate } from "@/router.js";

console.log('%c✅ income-category-form.js подключён!', 'color: green; font-weight: bold;');

export class IncomeCategoryForm {
    constructor(router, type = 'income', id=null) {
        this.router = router;
        this.type = type;
        this.id = id;

        this.form = document.getElementById('income-category-form');
        this.nameInput = document.getElementById('name_category');
        this.cancelBtn = this.form.querySelector('.btn-danger');
        this.titleEl = document.getElementById('choosing-category'); // 👈 заголовок "Создание категории ..."

        this.init();
    }

    async init() {
        if (!this.form) {
            console.warn('⚠️ Форма категорий дохода не найдена.');
            return;
        }

        if (this.titleEl) {
            this.titleEl.textContent =
                this.type === 'income'
                    ? 'Создание категории доходов'
                    : 'Создание категории расходов';
        }

        // обработчик кнопки "Создать"
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // обработчик кнопки "Отмена"
        this.cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    getStorageKey() {
        return this.type === 'income' ? 'incomeCategories' : 'expenseCategories';
    }

    handleSubmit(e) {
        e.preventDefault();

        const title = this.nameInput.value.trim();
        if (!title) {
            alert('Введите название категории');
            return;
        }

        // пока храним локально
        const key = this.getStorageKey();
        const categories = JSON.parse(localStorage.getItem(key)) || [];
        const newCategory = { id: Date.now(), title };

        categories.push(newCategory);
        localStorage.setItem(key, JSON.stringify(categories));

        console.log('✅ Категория создана:', newCategory);

        // переход обратно
        navigate(`#/dashboard/categories?type=${this.type}`);
    }
}