import { navigate } from "@/router";
import { CustomHttp } from "@/services/custom-http";
import config from "@/config/config";
import * as bootstrap from "bootstrap";

interface Category {
    id: number;
    title: string;
    [key: string]: any;
}

type Mode = 'list' | 'form' | 'edit';

export class CategoriesPage {
    readonly router: typeof navigate;
    private type: string;
    readonly id: string | undefined;
    readonly mode: Mode;
    readonly container: HTMLElement | null;
    readonly form: HTMLFormElement | null;
    readonly nameInput: HTMLInputElement;
    private categories: Category[] = [];

    constructor(router: typeof navigate = navigate, type: string = 'income', id?: string) {
        this.router = router;
        this.type = type;
        this.id = id;

        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.type = params.get('type') || 'income';
        this.id = params.get('id') ?? undefined;
        this.mode = this.detectMode();

        this.container = document.getElementById('income-categories-container');
        this.form = document.getElementById('income-category-form') as HTMLFormElement | null;
        this.nameInput = document.getElementById('name_category') as HTMLInputElement;

        if (this.mode === 'list') this.loadCategories();
        if (this.mode === 'form') this.initForm();
        if (this.mode === 'edit') this.initEdit();
    }

    private detectMode(): Mode {
        const hash = window.location.hash;
        if (hash.includes('category-form')) return 'form';
        if (hash.includes('category-edit')) return 'edit';
        return 'list';
    }

    async loadCategories(): Promise<void> {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.type = params.get('type') || 'income';

        const titleEl = document.getElementById('category');
        if (titleEl) titleEl.textContent = this.type === 'income' ? 'Доходы' : 'Расходы';

        try {
            const response: Category[] | { error?: boolean; message?: string } =
                await CustomHttp.request(`${config.host}/categories/${this.type}`);
            if (!response || (response as any).error) throw new Error((response as any).message || 'Ошибка загрузки категорий');

            this.categories = response as Category[];
            this.renderCategories();
        } catch (err: any) {
            console.error('❌ Ошибка при загрузке категорий:', err.message);
            alert('Ошибка загрузки категорий');
        }
    }

    private renderCategories(): void {
        if (!this.container) return;
        this.container.innerHTML = '';

        this.categories.forEach(cat => {
            const col = document.createElement('div');
            col.className = 'card-custom';
            col.dataset.id = String(cat.id);

            col.innerHTML = `
                <div class="card p-7 shadow-sm" style="width: 352px;">
                    <h5 class="card-title">${cat.title}</h5>
                    <div class="d-flex mt-13">
                        <button class="btn btn-sm btn-primary me-13 edit-btn px-3 py-10" data-id="${cat.id}">Редактировать</button>
                        <button class="btn btn-sm btn-danger delete-btn px-3 py-10" data-id="${cat.id}">Удалить</button>
                    </div>
                </div>
            `;

            if (this.container) {
                this.container.appendChild(col);
            }
        });

        const addCol = document.createElement('div');
        addCol.className = 'card-custom';
        addCol.innerHTML = `
            <div class="card justify-content-center align-items-center border-dashed shadow-sm"
                 style="cursor: pointer; height: 135px;">
                <div class="fs-1 text-body-tertiary">+</div>
            </div>`;
        this.container.appendChild(addCol);

        this.container.querySelectorAll<HTMLButtonElement>('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.router(`#/dashboard/category-edit?type=${this.type}&id=${id}`);
            });
        });

        this.container.querySelectorAll<HTMLButtonElement>('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
        });

        addCol.addEventListener('click', () => {
            this.router(`#/dashboard/category-form?type=${this.type}`);
        });
    }

    private async handleDelete(id: string | undefined): Promise<void> {
        if (!id) return;

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
                    await CustomHttp.request(`${config.host}/categories/${this.type}/${id}`, 'DELETE');
                    this.categories = this.categories.filter(cat => cat.id !== Number(id));
                    const el = this.container?.querySelector(`[data-id="${id}"]`);
                    if (el) el.remove();
                    resolve();
                } catch (err: any) {
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

    private initForm(): void {
        if (!this.form) return;
        const title = document.getElementById('choosing-category');
        if (title) {
            title.textContent = this.type === 'income'
                ? 'Создание категории доходов'
                : 'Создание категории расходов';
        }

        this.form.addEventListener('submit', e => this.submitForm(e, 'POST'));
        this.form.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', e => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    private async initEdit(): Promise<void> {
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
            // Проверка на ошибку
            if ((response as any).error) {
                throw new Error((response as any).message || 'Ошибка загрузки категорий');
            }
            const categories = response as Category[];
            const category = categories.find((c: Category) => c.id === Number(this.id));
            if (!category) throw new Error('Категория не найдена');
            if (this.nameInput) this.nameInput.value = category.title;
        } catch (err: any) {
            console.error('Ошибка при загрузке категории:', err.message);
        }

        this.form.addEventListener('submit', e => this.submitForm(e, 'PUT', this.id));
        this.form.querySelector<HTMLButtonElement>('.cancel-btn')?.addEventListener('click', e => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    private async submitForm(e: Event, method: 'POST' | 'PUT', id: string | null = null): Promise<void> {
        e.preventDefault();
        const title = this.nameInput.value.trim();
        if (!title) return alert('Введите название категории');

        const url = id
            ? `${config.host}/categories/${this.type}/${id}`
            : `${config.host}/categories/${this.type}`;

        try {
            const result: { error?: boolean; message?: string } = await CustomHttp.request(url, method, { title });
            if (result?.error) throw new Error(result.message || 'Ошибка при сохранении');
            navigate(`#/dashboard/categories?type=${this.type}`);
        } catch (err: any) {
            console.error('Ошибка при сохранении категории:', err.message);
            alert('Не удалось сохранить категорию');
        }
    }
}

