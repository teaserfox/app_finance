// src/pages/categories.js
import { navigate } from "@/router.js";
import { CustomHttp } from "@/services/custom-http.js";
import config from "../../config/config.js";

console.log('%c✅ categories.js подключён!', 'color: green; font-weight: bold;');

export class CategoriesPage {
    constructor(router) {
        this.router = router;

        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.type = params.get('type') || 'income';
        this.id = params.get('id') || null;
        this.mode = this.detectMode();

        // Получаем элементы только после вставки шаблона
        this.container = document.getElementById('income-categories-container');
        this.form = document.getElementById('income-category-form');
        this.nameInput = document.getElementById('name_category');

        // Теперь проверяем mode и инициализируем
        if (this.mode === 'list') this.loadCategories();
        if (this.mode === 'form') this.initForm();
        if (this.mode === 'edit') this.initEdit();
    }

    detectMode() {
        const hash = window.location.hash;
        if (hash.includes('category-form')) return 'form';
        if (hash.includes('category-edit')) return 'edit';
        return 'list';
    }

    // === 📋 ЗАГРУЗКА СПИСКА КАТЕГОРИЙ ===
    async loadCategories() {
        const titleEl = document.getElementById('category');
        if (titleEl) {
            titleEl.textContent = this.type === 'income' ? 'Доходы' : 'Расходы';
        }

        try {
            const response = await CustomHttp.request(`${config.host}/categories/${this.type}`);
            if (!response || response.error) throw new Error(response?.message || 'Ошибка загрузки категорий');

            this.categories = response;
            this.renderCategories();
        } catch (err) {
            console.error('❌ Ошибка при загрузке категорий:', err.message);
            alert('Ошибка загрузки категорий');
        }
    }

    // === 🧱 ОТРИСОВКА СПИСКА ===
    renderCategories() {
        if (!this.container) return;
        this.container.innerHTML = '';

        this.categories.forEach(cat => {
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

        const addCol = document.createElement('div');
        addCol.className = 'card-custom';
        addCol.innerHTML = `
            <div class="card justify-content-center align-items-center border-dashed shadow-sm"
                 style="cursor: pointer; height: 135px;">
                <div class="fs-1 text-body-tertiary">+</div>
            </div>`;

        this.container.appendChild(addCol);

        this.container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.dataset.id;
                this.router.navigate(`#/dashboard/category-edit?type=${this.type}&id=${id}`);
            });
        });

        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => this.handleDelete(e.target.dataset.id));
        });

        addCol.addEventListener('click', () => {
            this.router.navigate(`#/dashboard/category-form?type=${this.type}`);
        });
    }

    // === 🗑️ УДАЛЕНИЕ ===
    async handleDelete(id) {
        // Находим кнопки модалки
        const confirmModalEl = document.getElementById('confirmModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (!confirmModalEl || !confirmDeleteBtn) {
            alert('Модальное окно не найдено');
            return;
        }

        // Создаем экземпляр модалки Bootstrap
        const modal = new bootstrap.Modal(confirmModalEl);

        return new Promise((resolve, reject) => {
            // Показываем модалку
            modal.show();

            // Обработчик кнопки подтверждения
            const confirmHandler = async () => {
                try {
                    await CustomHttp.request(`${config.host}/categories/${this.type}/${id}`, 'DELETE');
                    this.categories = this.categories.filter(cat => cat.id != id);
                    const el = this.container.querySelector(`[data-id="${id}"]`);
                    if (el) el.remove();
                    resolve();
                } catch (err) {
                    console.error('Ошибка при удалении:', err.message);
                    alert('Не удалось удалить категорию');
                    reject(err);
                } finally {
                    modal.hide();
                    confirmDeleteBtn.removeEventListener('click', confirmHandler);
                }
            };

            confirmDeleteBtn.addEventListener('click', confirmHandler);
        });
    }

    // === 🧾 СОЗДАНИЕ НОВОЙ КАТЕГОРИИ ===
    initForm() {
        if (!this.form) return;
        const title = document.getElementById('choosing-category');
        if (title) {
            title.textContent = this.type === 'income'
                ? 'Создание категории доходов'
                : 'Создание категории расходов';
        }

        this.form.addEventListener('submit', (e) => this.submitForm(e, 'POST'));
        this.form.querySelector('.btn-danger').addEventListener('click', (e) => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    // === ✏️ РЕДАКТИРОВАНИЕ ===
    async initEdit() {
        if (!this.form || !this.id) {
            navigate(`#/dashboard/categories?type=${this.type}`);
            return;
        }

        const title = document.getElementById('editing-category');
        if (title) {
            title.textContent = this.type === 'income'
                ? 'Редактирование категории доходов'
                : 'Редактирование категории расходов';
        }

        try {
            const response = await CustomHttp.request(`${config.host}/categories/${this.type}`);
            const category = response.find(c => c.id === Number(this.id));
            if (!category) throw new Error('Категория не найдена');
            this.nameInput.value = category.title;
        } catch (err) {
            console.error('Ошибка при загрузке категории:', err.message);
        }

        this.form.addEventListener('submit', (e) => this.submitForm(e, 'PUT', this.id));
        this.form.querySelector('.cancel-btn').addEventListener('click', (e) => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    // === 💾 СОЗДАНИЕ / РЕДАКТИРОВАНИЕ (общий метод) ===
    async submitForm(e, method, id = null) {
        e.preventDefault();

        const title = this.nameInput.value.trim();
        if (!title) return alert('Введите название категории');

        const url = id
            ? `${config.host}/categories/${this.type}/${id}`
            : `${config.host}/categories/${this.type}`;

        try {
            const result = await CustomHttp.request(url, method, { title });
            if (result?.error) throw new Error(result.message || 'Ошибка при сохранении');
            navigate(`#/dashboard/categories?type=${this.type}`);
        } catch (err) {
            console.error('Ошибка при сохранении категории:', err.message);
            alert('Не удалось сохранить категорию');
        }
    }
}
