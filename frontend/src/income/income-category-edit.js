// src/income/income-category-edit.js
import { navigate } from "@/router.js";

console.log('%c✏️ income-category-edit.js подключён!', 'color: orange; font-weight: bold;');

export class IncomeCategoryEditPage {
    constructor(router, type='income', id=null) {
        this.router = router;
        this.type = type;
        this.currentCategoryId = id || this.getCategoryIdFromURL();

        this.form = document.getElementById('income-category-form');
        this.inputName = document.getElementById('name_category');
        this.saveBtn = this.form.querySelector('.edit-btn'); // Кнопка сохранить
        this.deleteBtn = this.form.querySelector('.delete-btn'); // Кнопка удалить
        this.titleEditing = document.getElementById('editing-category'); // 👈 заголовок "Редактирование категории ..."

        this.init();
    }

    /**
     * Получение ID категории из URL
     *
     * @returns {string|null} Возвращает ID категории или null
     */
    getCategoryIdFromURL() {
        const hashParams = window.location.hash.includes("?")
            ? new URLSearchParams(window.location.hash.split('?')[1])
            : {};

        return hashParams.get('id');
    }

    /**
     * Основной метод инициализации страницы
     */
    async init() {
        if (!this.currentCategoryId) {
            console.warn('⚠️ ID категории не найден, возвращаемся на список');
            navigate(`#/dashboard/categories?type=${this.type}`);
            return;
        }

        if (this.titleEditing) {
            this.titleEditing.textContent =
                this.type === 'income'
                    ? 'Редактирование категории доходов'
                    : 'Редактирование категории расходов';
        }

        try {
            await this.loadCategory(); // загружаем существующую категорию
            this.handleSave(); // обрабатываем сохранение
            this.handleDelete(); // обработка удаления
        } catch (err) {
            console.error(err.message); // выводим ошибку
        }
    }

    /**
     * Метод загрузки категории из Local Storage
     */
    async loadCategory() {
        const storageKey = this.getStorageKey();
        let stored = JSON.parse(localStorage.getItem(storageKey)) || [];
        const category = stored.find(c => c.id === Number(this.currentCategoryId));

        if (!category) {
            console.warn('⚠️ Категория не найдена');
            navigate(`#/dashboard/categories?type=${this.type}`);
            return;
        }

        // Заполняем поле ввода названием категории
        this.inputName.value = category.title;
        this.inputName.placeholder = '';
    }

    /**
     * Обработка события сохранения изменений
     */
    handleSave() {
        this.saveBtn.addEventListener('click', async () => {
            const name = this.inputName.value.trim();

            if (!name) {
                alert('Введите новое название категории.');
                return;
            }

            const storageKey = this.getStorageKey();
            let stored = JSON.parse(localStorage.getItem(storageKey)) || [];
            const index = stored.findIndex(c => c.id === Number(this.currentCategoryId));

            if (index !== -1) {
                stored[index].title = name;
                localStorage.setItem(storageKey, JSON.stringify(stored));

                console.log(`✅ Категория №${this.currentCategoryId} успешно обновлена.`);
                navigate(`#/dashboard/categories?type=${this.type}`);
            } else {
                console.error('Ошибка обновления категории!');
            }
        });
    }

    /**
     * Удаление категории
     */
    handleDelete() {
        this.deleteBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите удалить категорию?')) {
                const storageKey = this.getStorageKey();
                let stored = JSON.parse(localStorage.getItem(storageKey)) || [];
                const index = stored.findIndex(c => c.id === Number(this.currentCategoryId));

                if (index !== -1) {
                    stored.splice(index, 1);
                    localStorage.setItem(storageKey, JSON.stringify(stored));

                    console.log(`Категорию №${this.currentCategoryId} удалили`);
                    navigate(`#/dashboard/categories?type=${this.type}`);
                } else {
                    console.error('Категория не найдена для удаления!');
                }
            }
        });
    }

    /**
     * Получение ключа хранилища (доход или расход)
     */
    getStorageKey() {
        return this.type === 'income'
            ? 'incomeCategories'
            : 'expenseCategories';
    }
}
