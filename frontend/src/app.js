import './scss/styles.scss';
import {Router} from "./router.js";

console.log('%c✅ app.js успешно подключён!', 'color: green; font-size: 16px;');


class App {
    constructor() {
        this.router = new Router();
        window.addEventListener('DOMContentLoaded', this.handleRouteChanging.bind(this));
        window.addEventListener('hashchange', this.handleRouteChanging.bind(this));

    }

    handleRouteChanging() {
        this.router.openRoute();
    }
}

(new App());