import {Form} from "./js/form.js";
// import {Choice} from "./components/choice.js";
// import {Test} from "./components/test.js";
// import {Result} from "./components/result.js";
// import {Answer} from "./components/answers.js";
import {Auth} from "./services/auth.js";

export class Router {
    constructor() {
        // Контейнер, куда будут подгружаться страницы (если используется ядро)
        this.contentElement = document.getElementById('app-content'); // в index.html
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
                load: () => {
                    console.log('Загрузка ядра приложения');
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
        const route = this.routes.find(r => r.route === currentHash);

        if (!route) {
            window.location.hash = '#/signup';
            return;
        }

        // Получаем HTML шаблон
        const response = await fetch(route.template);
        const html = await response.text();

        // Если страница login или signup — подменяем весь body (т.к. они не встраиваются в index)
        if (['#/signup', '#/login'].includes(route.route)) {
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
