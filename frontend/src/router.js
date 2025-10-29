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
import {CategoriesPage} from "@/pages/categories.js";


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
                path: '#/dashboard/categories',
                template: 'dashboard/categories.html',
                protected: true,
                name: 'categories',
                load: (router) => new CategoriesPage(router)
            },
            {
                path: '#/dashboard/category-form',
                template: 'dashboard/income-category-form.html',
                protected: true,
                name: 'category-form',
                load: (router, container) => {
                    const params = new URLSearchParams(window.location.hash.split('?')[1]);
                    const type = params.get('type') || 'income';
                    new CategoriesPage(router, type); // элементы уже в DOM
                }
            },
            {
                path: '#/dashboard/category-edit',
                template: 'dashboard/income-category-edit.html',
                protected: true,
                name: 'category-edit',
                load: (router, container) => {
                    const params = new URLSearchParams(window.location.hash.split('?')[1]);
                    const type = params.get('type') || 'income';
                    const id = params.get('id');
                    new CategoriesPage(router, type, id); // элементы уже в DOM
                }
            },
        ];

        this.defaultRoute = '#/login';
        this.appContainer = null;
        this.sidebarLoaded = false;
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
        } else {
            hash = hash.replace(/^#+/, '#'); // убирает двойные решётки
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

        // --- Управление Sidebar ---
        const sidebarContainer = document.getElementById('sidebar-container');
        const mainWrapper = document.getElementById('index');
        if (currentHash.startsWith('#/dashboard')) {
            if (!this.sidebarLoaded) {
                try {
                    const sidebarHtml = await fetch(this.templatesBasePath + 'sidebar.html').then(r => r.text());
                    sidebarContainer.innerHTML = sidebarHtml;
                    new Sidebar(this);
                    this.sidebarLoaded = true;
                } catch (err) {
                    console.warn('⚠️ Ошибка при загрузке sidebar:', err);
                }
            }

            sidebarContainer.style.display = 'block';
            mainWrapper.classList.remove('justify-content-center');
        } else {
            if (sidebarContainer) sidebarContainer.style.display = 'none';
            mainWrapper.classList.add('justify-content-center');
        }

        // --- Загрузка контента страницы ---
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
            if (!res.ok) {
                console.warn('⚠️ Шаблон не найден или ошибка сервера:', templatePath, res.status);
                return this.loadNotFound();
            }
        } catch (err) {
            console.warn('⚠️ Ошибка при fetch шаблона:', templatePath, err);
            return this.loadNotFound();
        }

        const html = await res.text();
        this.appContainer.innerHTML = html;

        // --- Вызов user-defined load() после вставки шаблона ---
        if (typeof route.load === 'function') {
            // передаем appContainer, чтобы элементы уже были в DOM
            await route.load(this, this.appContainer);
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
                if (this.appContainer) {
                    this.appContainer.innerHTML = `<div class="p-5 text-center">Страница не найдена</div>`;
                }
                return;
            }
            const html = await res.text();
            if (this.appContainer) {
                this.appContainer.innerHTML = html;
            }
        } catch {
            if (this.appContainer) {
                this.appContainer.innerHTML = `<div class="p-5 text-center">Страница не найдена</div>`;
            }
        }
    }
}

// создаём один экземпляр роутера для всего приложения
    export
    const
    routerInstance = new Router();

// удобная функция navigate
    export
    const
    navigate = (path) => routerInstance.navigate(path);







