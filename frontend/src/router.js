// src/js/router.js
/**
 * SPA Router — загружает HTML-шаблоны в #app-content и инициализирует page-specific JS.
 *
 * Принципы:
 * - все шаблоны ожидаются в папке ./templates/ (можно изменить templatesBasePath)
 * - маршруты описаны в routes (массив объектов) с полями:
 *   - path: '#/login'
 *   - template: 'login.html' (относительно templatesBasePath)
 *   - protected: true|false
 *   - initModule: './js/pages/login.init.js' (опционально) — ES module, будет импортирован через import()
 *
 * - Router.navigate(hash, { replace: false }) — централизованная навигация
 * - Router избегает многократной динамической загрузки одного и того же initModule
 */

// router.js
import {Auth} from "@/services/auth.js";
import {Form} from "@/js/form.js";
import {Sidebar} from "@/js/sidebar.js";


export class Router {
    constructor() {
        this.templatesBasePath = './templates/';
        this.routes = [
            {
                path: '#/signup',
                template: 'signup.html',
                protected: false,
                name: 'signup',
                load: (router, container) => {
                    new Form('signup', router, container);
                }
            },
            {
                path: '#/login',
                template: 'login.html',
                protected: false,
                name: 'login',
                load: (router, container) => {
                    new Form('login', router, container);
                }
            },
            {
                path: '#/sidebar',
                template: 'sidebar.html',
                protected: true,
                name: 'sidebar',
                load: (router) => {
                    new Sidebar(router);
                }
            },
            {
                path: '#/dashboard/balance',
                template: 'dashboard/balance.html',
                protected: true,
                name: 'balance'
            },
            {
                path: '#/dashboard/categories',
                template: 'dashboard/categories.html',
                protected: true,
                name: 'categories'
            },
            {
                path: '#/dashboard/operations',
                template: 'dashboard/operations.html',
                protected: true,
                name: 'operations'
            },
        ];

        this.defaultRoute = '#/login';
        this.appContainer = null;
        this.loadedModules = new Set();
    }

    /**
     * Инициализация Router — вызывается один раз при старте приложения
     */
    init() {
        this.appContainer = document.getElementById('app-content') || document.body;

        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('DOMContentLoaded', () => this.handleRouteChange());

        console.log('%c✅ Router инициализирован (class version)', 'color: green; font-weight: bold;');
    }

    /**
     * Получить текущий hash без query-параметров
     */
    getCurrentRouteHash() {
        const raw = window.location.hash || this.defaultRoute;
        return raw.split('?')[0];
    }

    /**
     * Найти маршрут по хэшу
     */
    findRouteByHash(hash) {
        return this.routes.find(r => r.path === hash) || null;
    }

    /**
     * Проверка авторизации
     */
    isAuthenticated() {
        return Boolean(localStorage.getItem(Auth.accessTokenKey));
    }

    /**
     * Централизованная навигация
     */
    navigate(hash, options = {replace: false}) {
        if (!hash) return;

        // Нормализация: 'login' → '#/login'
        if (!hash.startsWith('#/')) {
            hash = '#/' + hash.replace(/^#\/?/, '');
        }

        if (options.replace) {
            history.replaceState(null, '', hash);
            this.handleRouteChange();
        } else {
            if (window.location.hash !== hash) {
                window.location.hash = hash; // вызовет hashchange
            } else {
                this.handleRouteChange(); // если тот же маршрут — обновляем вручную
            }
        }
    }

    /**
     * Обработка изменения маршрута
     */
    async handleRouteChange() {
        const currentHash = this.getCurrentRouteHash();
        const route = this.findRouteByHash(currentHash);

        if (!route) {
            console.warn(`⚠️ Router: неизвестный маршрут ${currentHash}`);
            return this.loadNotFound();
        }

        // Защищённые маршруты
        if (route.protected && !this.isAuthenticated()) {
            console.warn('🚫 Доступ запрещён — пользователь не авторизован');
            return this.navigate('#/login');
        }

        // Редирект авторизованного пользователя с логин/регистрации
        if (!route.protected && this.isAuthenticated() && ['#/login', '#/signup'].includes(route.path)) {
            return this.navigate('#/sidebar');
        }

        await this.loadTemplateAndInit(route);
    }

    /**
     * Загрузка шаблона и инициализация соответствующего JS-модуля
     */
    async loadTemplateAndInit(route) {
        if (!this.appContainer) return;

        const templatePath = this.templatesBasePath + route.template;
        let res;
        try {
            res = await fetch(templatePath);
        } catch (err) {
            console.warn('⚠️ Ошибка при fetch шаблона:', templatePath, err);
            return this.loadNotFound();
        }

        if (!res.ok) {
            console.warn('⚠️ Шаблон не найден или ошибка сервера:', templatePath, res.status);
            return this.loadNotFound();
        }

        const html = await res.text();
        this.appContainer.innerHTML = html;

        // --- Вызов user-defined load() если есть ---
        if (typeof route.load === 'function') {
            try {
                // вызываем синхронно или асинхронно (поддерживаем Promise)
                const maybePromise = route.load(this, this.appContainer);
                if (maybePromise instanceof Promise) {
                    await maybePromise;
                }
            } catch (err) {
                console.warn('⚠️ Ошибка в route.load():', err);
            }
            return;
        }

        // --- Для обратной совместимости: если остался initModule (но без динамики) ---
        if (route.initModule) {
            // если хочешь — реализуй карту статических импортов здесь, но не динамический import()
            console.warn('⚠️ route.initModule устарел — используйте route.load вместо initModule');
        }
    }


    /**
     * Динамическая инициализация JS-модуля страницы
     */
    async initModule(modulePath) {
        try {
            const module = await import(/* @vite-ignore */ modulePath);
            if (module && typeof module.init === 'function') {
                await module.init();
            }
            this.loadedModules.add(modulePath);
        } catch (err) {
            console.warn('⚠️ Ошибка загрузки initModule:', err);
        }
    }

    /**
     * Загрузка страницы 404
     */
    async loadNotFound() {
        const path404 = this.templatesBasePath + '404.html';
        try {
            const res = await fetch(path404);
            if (!res.ok) {
                this.appContainer.innerHTML = `<div class="p-5 text-center">Страница не найдена</div>`;
                return;
            }
            this.appContainer.innerHTML = await res.text();
        } catch {
            this.appContainer.innerHTML = `<div class="p-5 text-center">Страница не найдена</div>`;
        }
    }
}






