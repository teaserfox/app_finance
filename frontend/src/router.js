import {Form} from "./js/form.js";
import {Auth} from "./services/auth.js";
import {Sidebar} from "@/js/sidebar";

console.log('%c✅ router.js успешно подключён!', 'color: green; font-size: 16px;');

export class Router {
    constructor() {
        // Контейнер, куда будут подгружаться страницы (если используется ядро)
        this.contentElement = document.getElementById('app-content'); // в sidebar.html
        this.routes = [
            {
                route: '#/signup',
                title: 'Регистрация',
                template: 'signup.html',
                load: () => new Form('signup')
            },
            {
                route: '#/login',
                title: 'Авторизация',
                template: 'templates/login.html',
                load: () => new Form('login')
            },
            {
                route: '#/sidebar',
                title: 'Главная',
                template: 'templates/sidebar.html',
                load: async () => {
                    new Sidebar('sidebar');
                    // const { UserManager } = await import('./utils/url-manager.js');
                    // UserManager.initUserUI();
                }
            },
            // при необходимости добавим позже:
            // {
            //     route: '#/categories',
            //     title: 'Категории',
            //     template: 'templates/dashboard/categories.html',
            //     load: () => new CategoriesManager()
            // }
        ];

        // Следим за изменением хэша
        window.addEventListener('hashchange', () => this.openRoute());
        window.addEventListener('DOMContentLoaded', () => this.openRoute());
    }

    async openRoute() {
        const currentHash = window.location.hash.split('?')[0] || '#/signup';

        // Проверка авторизации
        const accessToken = localStorage.getItem(Auth.accessTokenKey);
        if (accessToken && ['#/login', '#/signup'].includes(currentHash)) {
            window.location.hash = '#/sidebar';
            return;
        }

        const route = this.routes.find(r => r.route === currentHash);
        if (!route) {
            window.location.hash = '#/signup';
            return;
        }

        // Получаем HTML шаблон
        const response = await fetch(route.template);
        const html = await response.text();


        if (['#/signup', '#/login', '#/sidebar'].includes(route.route)) {
            document.body.innerHTML = html;
            document.title = route.title;
            route.load();
            return;
        }

        // Для внутренних страниц ядра (dashboard и вложенные)
        if (this.contentElement) {
            this.contentElement.innerHTML = html;
            document.title = route.title;
            route.load();
        } else {
            console.error('❌ Не найден контейнер #app-content для встраивания шаблонов');
        }
    }
}
