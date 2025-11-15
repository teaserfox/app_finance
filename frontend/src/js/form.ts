import config from "@/config/config";
import { Auth } from "@/services/auth";
import {LoginResponse, User} from "@/types/token-user-login.type";
import {CustomHttp} from "@/services/custom-http";
import { SessionManager } from "@/utils/session-manager";
import { Router } from "@/router";
import {FormType} from "@/types/form.type";
import { StoredUserType } from "@/types/stored-user.type";
import {HttpErrorType} from "@/types/http-error.type";


export class Form {
    readonly page: string;
    private router: Router;
    private container: HTMLElement;
    private processButton: HTMLButtonElement | null;
    private fields: FormType[];

    constructor(page: string, router: Router, container: HTMLElement = document.body) {
        this.page = page;
        this.router = router;
        this.container = container;
        this.processButton = null;
        this.fields = this.getBaseFields();

        if (page === 'signup') this.addSignupFields();

        this.initFields();
        this.initButton();
        this.initLinks();
    }

    private getBaseFields(): FormType[] {
        return [
            { name: 'email', id: 'email', regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, valid: false },
            { name: 'password', id: 'password', regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, valid: false }
        ];
    }

    private addSignupFields(): void {
        this.fields.unshift(
            { name: 'name', id: 'name', regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/, valid: false },
            { name: 'lastName', id: 'last-name', regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/, valid: false }
        );
        this.fields.push({ name: 'passwordRepeat', id: 'passwordRepeat', valid: false });
    }

    private initLinks(): void {
        this.container.querySelectorAll('[data-link]').forEach((link: Element): void => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const href: string | null = link.getAttribute('href');
                if (href) this.router.navigate(href);
            });
        });
    }

    private initFields(): void {
        this.fields.forEach((field: FormType): void => {
            const element: HTMLInputElement | null = this.container.querySelector<HTMLInputElement>(`#${field.id}`);
            if (!element) {
                console.warn(`⚠️ Поле #${field.id} не найдено!`);
                field.element = null;
                return;
            }
            field.element = element;
            element.addEventListener('input', (): void => this.validateField(field));
        });
    }

    private initButton(): void {
        this.processButton = this.container.querySelector<HTMLButtonElement>('#process');
        if (!this.processButton) return;
        this.processButton.addEventListener('click', (): Promise<void> => this.processForm());
    }

    private validateField(field: FormType): void {
        if (!field.element) return;
        const value: string = field.element.value.trim();

        if (field.name === 'passwordRepeat') {
            const passField: FormType | undefined = this.fields.find((f: FormType): boolean => f.name === 'password');
            field.valid = Boolean(value && passField?.element?.value === value && passField?.valid);
        } else if (field.regex) {
            field.valid = field.regex.test(value);
        } else {
            field.valid = false;
        }

        field.element.classList.toggle('is-valid', field.valid);
        field.element.classList.toggle('is-invalid', !field.valid);
        this.validateForm();
    }

    private validateForm(): boolean {
        const allValid = this.fields.every(f => f.valid);
        if (this.processButton) this.processButton.disabled = !allValid;
        return allValid;
    }

    private getValue(name: string): string {
        return this.fields.find((f: FormType): boolean => f.name === name)?.element?.value.trim() ?? '';
    }

    private showError(message: string): void {
        console.error('❌ Ошибка:', message);
        alert(message);
    }

    private async processForm(): Promise<void> {
        if (!this.validateForm()) return;

        const email: string = this.getValue('email');
        const password: string = this.getValue('password');
        const rememberMe: boolean | undefined = this.container.querySelector<HTMLInputElement>('#flexCheckDefault')?.checked;

        try {
            if (this.page === 'signup') {
                await this.handleSignup(email, password);
            } else {
                await this.handleLogin(email, password, Boolean(rememberMe));
            }
        } catch (e: unknown) {
            this.showError(e instanceof Error ? e.message : 'Неизвестная ошибка');
        }
    }

    private async handleSignup(email: string, password: string): Promise<void> {
        const result: LoginResponse | HttpErrorType = await CustomHttp.request<LoginResponse>(`${config.host}/signup`, 'POST', {
            name: this.getValue('name'),
            lastName: this.getValue('lastName'),
            email,
            password,
            passwordRepeat: this.getValue('passwordRepeat'),
        });

        if ('error' in result || !result.user) throw new Error(result.message || 'Ошибка регистрации');

        this.router.navigate('#/login');
    }



    private async handleLogin(email: string, password: string, rememberMe: boolean): Promise<void> {
        // Запрос на сервер
        const result: LoginResponse | HttpErrorType = await CustomHttp.request<LoginResponse>(
            `${config.host}/login`,
            'POST',
            { email, password }
        );

        // Проверка на ошибки
        if ('error' in result || !result.tokens?.accessToken || !result.user) {
            throw new Error(result.message || 'Ошибка входа');
        }

        const user: User = result.user;

        // Сохраняем токены
        Auth.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

        // Сохраняем полную информацию о пользователе в Auth (User)
        Auth.setUserInfo(user);
        if (rememberMe) Auth.saveUserToList(user);

        // Создаём объект для локального использования в сессии
        const storedUser: StoredUserType = {
            fullName: `${user.name} ${user.lastName}`,
            userId: user.id,
            email: user.email,
        };
        SessionManager.setCurrentUser(storedUser);

        // Навигация
        this.router.navigate('#/dashboard/index');
    }

}




