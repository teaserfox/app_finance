import { navigate } from "@/router";
import { CustomHttp } from "@/services/custom-http";
import config from "@/config/config";
import * as bootstrap from "bootstrap";
import {CategoryType} from "@/types/category.type";
import { ModeType } from "@/types/mode.type";
import {HttpErrorType} from "@/types/http-error.type";

export class CategoriesPage {
    readonly router: typeof navigate;
    private type: string;
    readonly id: string | undefined;
    readonly mode: ModeType;
    readonly container: HTMLElement | null;
    readonly form: HTMLFormElement | null;
    readonly nameInput: HTMLInputElement;
    private categories: CategoryType[] = [];

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

        if (this.mode === 'list') void this.loadCategories();
        if (this.mode === 'form') void this.initForm();
        if (this.mode === 'edit') void this.initEdit();
    }

    private detectMode(): ModeType {
        const hash: string = window.location.hash;
        if (hash.includes('category-form')) return 'form';
        if (hash.includes('category-edit')) return 'edit';
        return 'list';
    }

    private async loadCategories(): Promise<void> {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.type = params.get('type') || 'income';

        const titleEl: HTMLElement | null = document.getElementById('category');
        if (titleEl) titleEl.textContent = this.type === 'income' ? 'Доходы' : 'Расходы';

        try {
            const response: CategoryType[] | HttpErrorType =
                await CustomHttp.request<CategoryType[]>(`${config.host}/categories/${this.type}`);

            if ((response as HttpErrorType).error) {
                throw new Error((response as HttpErrorType).message);
            }

            this.categories = response as CategoryType[];


            this.categories = response as CategoryType[];   // ← теперь тип строго CategoryType[]
            this.renderCategories();

        } catch (err) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('❌ Ошибка при загрузке категорий:', msg);
            alert('Ошибка загрузки категорий');
        }
    }

    private renderCategories(): void {
        if (!this.container) return;
        this.container.innerHTML = '';

        this.categories.forEach((cat: CategoryType): void => {
            const col: HTMLDivElement = document.createElement('div');
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

        const addCol: HTMLDivElement = document.createElement('div');
        addCol.className = 'card-custom';
        addCol.innerHTML = `
            <div class="card justify-content-center align-items-center border-dashed shadow-sm"
                 style="cursor: pointer; height: 135px;">
                <div class="fs-1 text-body-tertiary">+</div>
            </div>`;
        this.container.appendChild(addCol);

        this.container.querySelectorAll<HTMLButtonElement>('.edit-btn').forEach((btn: HTMLButtonElement): void => {
            btn.addEventListener('click', (): void => {
                const id: string | undefined = btn.dataset.id;
                this.router(`#/dashboard/category-edit?type=${this.type}&id=${id}`);
            });
        });

        this.container.querySelectorAll<HTMLButtonElement>('.delete-btn').forEach((btn: HTMLButtonElement): void => {
            btn.addEventListener('click', (): Promise<void> => this.handleDelete(btn.dataset.id));
        });

        addCol.addEventListener('click', (): void => {
            this.router(`#/dashboard/category-form?type=${this.type}`);
        });
    }

    private async handleDelete(id: string | undefined): Promise<void> {
        if (!id) return;

        const confirmModalEl: HTMLElement | null = document.getElementById('confirmModal');
        const confirmDeleteBtn: HTMLElement | null = document.getElementById('confirmDeleteBtn');

        if (!confirmModalEl || !confirmDeleteBtn) {
            alert('Модальное окно не найдено');
            return;
        }

        const modal = new bootstrap.Modal(confirmModalEl);

        return new Promise((resolve, reject): void => {
            modal.show();

            const confirmHandler = async (): Promise<void> => {
                try {
                    await CustomHttp.request(`${config.host}/categories/${this.type}/${id}`, 'DELETE');
                    this.categories = this.categories.filter((cat: CategoryType): boolean => cat.id !== Number(id));
                    const el: Element | null | undefined = this.container?.querySelector(`[data-id="${id}"]`);
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
        const title: HTMLElement | null = document.getElementById('choosing-category');
        if (title) {
            title.textContent = this.type === 'income'
                ? 'Создание категории доходов'
                : 'Создание категории расходов';
        }

        this.form.addEventListener('submit', (e: SubmitEvent): Promise<void> => this.submitForm(e, 'POST'));
        this.form.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', (e: PointerEvent): void => {
            e.preventDefault();
            navigate(`#/dashboard/categories?type=${this.type}`);
        });
    }

    private async initEdit(): Promise<void> {
        if (!this.form || !this.id) {
            navigate(`#/dashboard/categories?type=${this.type}`);
            return;
        }

        const title: HTMLElement | null = document.getElementById('editing-category');
        if (title) {
            title.textContent =
                this.type === 'income'
                    ? 'Редактирование категории доходов'
                    : 'Редактирование категории расходов';
        }

        try {
            const response: CategoryType[] | HttpErrorType = await CustomHttp.request<CategoryType[]>(
                `${config.host}/categories/${this.type}`
            );

            // → Проверяем что это ошибка
            if ('error' in response) {
                throw new Error(response.message);
            }

            // → Теперь TS точно знает: response — CategoryType[]
            this.categories = response;

            const category: CategoryType | undefined = this.categories.find(
                (c: CategoryType): boolean => c.id === Number(this.id)
            );

            if (!category) {
                throw new Error('Категория не найдена');
            }

            this.nameInput.value = category.title;

        } catch (err) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('❌ Ошибка при загрузке категории:', msg);
        }

        this.form.addEventListener('submit', (e: SubmitEvent): Promise<void> =>
            this.submitForm(e, 'PUT', this.id)
        );

        this.form
            .querySelector<HTMLButtonElement>('.cancel-btn')
            ?.addEventListener('click', (e: PointerEvent): void => {
                e.preventDefault();
                navigate(`#/dashboard/categories?type=${this.type}`);
            });
    }



    private async submitForm(
        e: Event,
        method: 'POST' | 'PUT',
        id: string | null = null
    ): Promise<void> {
        e.preventDefault();

        const title: string = this.nameInput.value.trim();
        if (!title) {
            alert('Введите название категории');
            return;
        }

        const url: string = id
            ? `${config.host}/categories/${this.type}/${id}`
            : `${config.host}/categories/${this.type}`;

        try {
            // результат может быть либо null, либо ошибка
            const response: HttpErrorType | null = await CustomHttp.request<null>(url, method, { title });

            if (!response) {
                throw new Error('Сервер вернул пустой ответ');
            }

            // проверяем, ошибка ли это
            if ('error' in response && response.error) {
                throw new Error(response.message || 'Ошибка загрузки категории');
            }

            // если сюда дошли — всё успешно
            navigate(`#/dashboard/categories?type=${this.type}`);

        } catch (err) {
            const msg: string = err instanceof Error ? err.message : 'Неизвестная ошибка';
            console.error('❌ Ошибка при сохранении категории:', msg);
            alert('Не удалось сохранить категорию');
        }
    }


}

