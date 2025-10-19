import config from "../../config/config.js";
import { Auth } from "@/services/auth.js";
import { CustomHttp } from "@/services/custom-http.js";
import {SessionManager} from "@/utils/session-manager.js";

console.log('%c✅ form.js успешно подключён!', 'color: green; font-size: 16px;');

export class Form {
    constructor(page) {
        this.page = page;
        this.processButton = null;

        // // Проверка на авторизацию — если есть токен, переходим в основную часть
        // const accessToken = localStorage.getItem(Auth.accessTokenKey);
        // if (accessToken) {
        //     location.href = '#/sidebar';
        //     return;
        // }

        // Базовые поля для всех страниц
        this.fields = [
            {
                name: 'email',
                id: 'email',
                regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                element: null,
                valid: false,
            },
            {
                name: 'password',
                id: 'password',
                regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                element: null,
                valid: false,
            }
        ];

        // Если это страница регистрации — добавляем имя, фамилию и подтверждение пароля
        if (this.page === 'signup') {
            this.fields.unshift(
                {
                    name: 'name',
                    id: 'name',
                    regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/,
                    element: null,
                    valid: false,
                },
                {
                    name: 'lastName',
                    id: 'last-name',
                    regex: /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/,
                    element: null,
                    valid: false,
                }
            );

            // Добавляем поле подтверждения пароля
            this.fields.push({
                name: 'passwordRepeat',
                id: 'passwordRepeat',
                element: null,
                valid: false,
            });
        }

        // Инициализация формы
        this.initFields();
        this.initButton();
    }

    // Привязываем обработчики к полям
    initFields() {
        this.fields.forEach(field => {
            field.element = document.getElementById(field.id);
            if (field.element) {
                field.element.addEventListener('input', () => this.validateField(field));
            } else {
                console.warn(`⚠️ Элемент с id="${field.id}" не найден`);
            }
        });
    }

    // Инициализация кнопки отправки
    initButton() {
        this.processButton = document.getElementById('process');
        if (this.processButton) {
            this.processButton.addEventListener('click', () => this.processForm());
        } else {
            console.warn('⚠️ Кнопка с id="process" не найдена');
        }
    }

    // Проверка каждого поля
    validateField(field) {
        const element = field.element;
        const value = element.value.trim();

        // Проверка поля подтверждения пароля (только на signup)
        if (field.name === 'passwordRepeat') {
            const passwordField = this.fields.find(f => f.name === 'password');
            if (
                value &&
                value === passwordField.element.value &&
                passwordField.valid
            ) {
                element.classList.remove('is-invalid');
                element.classList.add('is-valid');
                field.valid = true;
            } else {
                element.classList.add('is-invalid');
                element.classList.remove('is-valid');
                field.valid = false;
            }
        }
        // Проверка обычных полей (email, name, lastName, password)
        else if (field.regex && value.match(field.regex)) {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
            field.valid = true;
        } else {
            element.classList.add('is-invalid');
            element.classList.remove('is-valid');
            field.valid = false;
        }

        this.validateForm();
    }

    // Проверка всей формы
    validateForm() {
        const valid = this.fields.every(f => f.valid);

        if (this.processButton) {
            this.processButton.disabled = !valid;
        }

        return valid;
    }

    // Обработка отправки формы
    async processForm() {
        if (!this.validateForm()) return;

        const email = this.getValue('email');
        const password = this.getValue('password');
        const rememberMe = document.querySelector('#flexCheckDefault')?.checked; // ✅ проверяем чекбокс

        if (this.page === 'signup') {
            try {
                const result = await CustomHttp.request(`${config.host}/signup`, 'POST', {
                    name: this.getValue('name'),
                    lastName: this.getValue('lastName'),
                    email,
                    password,
                    passwordRepeat: this.getValue('passwordRepeat'),
                });

                if (result.error || !result.user) {
                    throw new Error(result.message);
                }
                console.log('✅ Регистрация успешна:', result.user);
                location.href = '#/login';
                return; // остановим выполнение, чтобы не пошёл логин дальше
            } catch (err) {
                console.error('Ошибка регистрации:', err);
                return;
            }
        }

        // === ЛОГИН ===
        try {
            const result = await CustomHttp.request(`${config.host}/login`, 'POST', {
                email,
                password,
            });

            if (result.error || !result.tokens?.accessToken) {
                throw new Error(result.message);
            }

            // сохраняем активного пользователя
            Auth.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
            Auth.setUserInfo({
                fullName: `${result.user.name} ${result.user.lastName}`,
                userId: result.user.id,
                email,
            });

            // если отмечен чекбокс — добавляем в локальный список
            if (rememberMe) {
                Auth.saveUserToList({
                    fullName: `${result.user.name} ${result.user.lastName}`,
                    email: result.user.email,
                    // avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${result.user.email}`,
                });
            }

            // ✅ добавляем текущего пользователя в сессию
            SessionManager.setCurrentUser({
                fullName: `${result.user.name} ${result.user.lastName}`,
                userId: result.user.id,
                email: result.user.email,
            });

            location.href = '#/sidebar';
        } catch (err) {
            console.error('Ошибка входа:', err);
        }
    }

    // Получение значения поля
    getValue(name) {
        const field = this.fields.find(f => f.name === name);
        return field?.element?.value.trim() || '';
    }
}

