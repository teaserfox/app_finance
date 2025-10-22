import config from "../../config/config.js";
import { Auth } from "@/services/auth.js";
import { CustomHttp } from "@/services/custom-http.js";
import { SessionManager } from "@/utils/session-manager.js";

console.log('%c✅ form.js подключен и готов к работе!', 'color: green; font-weight: bold;');

export class Form {
    constructor(page, router, container = document) {
        this.page = page;
        this.router = router;
        this.container = container;
        this.processButton = null;

        this.fields = this.getBaseFields();

        if (page === 'signup') {
            this.addSignupFields();
        }

        this.initFields();
        this.initButton();
        this.initLinks();
    }

    /** Базовые поля (email и пароль) */
    getBaseFields() {
        return [
            {
                name: 'email',
                id: 'email',
                regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                valid: false,
            },
            {
                name: 'password',
                id: 'password',
                regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                valid: false,
            }
        ];
    }

    /** Добавляем поля для страницы регистрации */
    addSignupFields() {
        this.fields.unshift(
            {
                name: 'name',
                id: 'name',
                regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/,
                valid: false,
            },
            {
                name: 'lastName',
                id: 'last-name',
                regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/,
                valid: false,
            }
        );
        this.fields.push({
            name: 'passwordRepeat',
            id: 'passwordRepeat',
            valid: false,
        });
    }

    /** Инициализация ссылок с data-link */
    initLinks() {
        const links = this.container.querySelectorAll('[data-link]');
        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = link.getAttribute('href');
                if (target && this.router) {
                    this.router.navigate(target);
                }
            });
        });
    }

    /** Инициализация полей и обработчиков */
    initFields() {
        this.fields.forEach(field => {
            field.element = this.container.querySelector(`#${field.id}`);
            if (!field.element) {
                console.warn(`⚠️ Поле #${field.id} не найдено на странице`);
                return;
            }

            field.element.addEventListener('input', () => this.validateField(field));
        });
    }

    /** Инициализация кнопки отправки */
    initButton() {
        this.processButton = this.container.querySelector('#process');
        if (!this.processButton) {
            console.warn('⚠️ Кнопка отправки (#process) не найдена');
            return;
        }

        this.processButton.addEventListener('click', () => this.processForm());
    }

    /** Проверка отдельного поля */
    validateField(field) {
        const element = field.element;
        const value = element.value.trim();

        if (field.name === 'passwordRepeat') {
            const passwordField = this.fields.find(f => f.name === 'password');
            field.valid = value && value === passwordField.element.value && passwordField.valid;
        } else if (field.regex) {
            field.valid = field.regex.test(value);
        } else {
            field.valid = false;
        }

        element.classList.toggle('is-valid', field.valid);
        element.classList.toggle('is-invalid', !field.valid);
        this.validateForm();
    }

    /** Проверка всей формы */
    validateForm() {
        const allValid = this.fields.every(f => f.valid);
        if (this.processButton) this.processButton.disabled = !allValid;
        return allValid;
    }

    /** Получение значения поля */
    getValue(name) {
        return this.fields.find(f => f.name === name)?.element?.value.trim() || '';
    }

    /** Централизованная обработка ошибок */
    showError(message) {
        console.error('❌ Ошибка:', message);
        alert(message); // можно заменить на кастомный UI
    }

    /** Основная логика формы */
    async processForm() {
        if (!this.validateForm()) return;

        const email = this.getValue('email');
        const password = this.getValue('password');
        const rememberMe = this.container.querySelector('#flexCheckDefault')?.checked;

        try {
            if (this.page === 'signup') {
                await this.handleSignup(email, password);
            } else {
                await this.handleLogin(email, password, rememberMe);
            }
        } catch (err) {
            this.showError(err.message || 'Произошла ошибка при обработке формы');
        }
    }

    /** Регистрация нового пользователя */
    async handleSignup(email, password) {
        const result = await CustomHttp.request(`${config.host}/signup`, 'POST', {
            name: this.getValue('name'),
            lastName: this.getValue('lastName'),
            email,
            password,
            passwordRepeat: this.getValue('passwordRepeat'),
        });

        if (result.error || !result.user) {
            throw new Error(result.message || 'Ошибка регистрации');
        }

        console.log('✅ Регистрация успешна:', result.user);
        this.router.navigate('#/login');
    }

    /** Авторизация */
    async handleLogin(email, password, rememberMe) {
        const result = await CustomHttp.request(`${config.host}/login`, 'POST', {
            email,
            password,
        });

        if (result.error || !result.tokens?.accessToken) {
            throw new Error(result.message || 'Ошибка входа');
        }

        Auth.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        Auth.setUserInfo({
            fullName: `${result.user.name} ${result.user.lastName}`,
            userId: result.user.id,
            email,
        });

        if (rememberMe) {
            Auth.saveUserToList({
                fullName: `${result.user.name} ${result.user.lastName}`,
                email: result.user.email,
            });
        }

        SessionManager.setCurrentUser({
            fullName: `${result.user.name} ${result.user.lastName}`,
            userId: result.user.id,
            email: result.user.email,
        });

        this.router.navigate('#/sidebar');
    }
}


