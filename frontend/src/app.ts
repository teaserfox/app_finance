import './scss/styles.scss';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

import {Router} from "./router";
// import {BalanceUI} from "@/js/balance";

console.log('%c✅ app.js выполняется!', 'color: green; font-weight: bold;');

// // создаём глобальный экземпляр баланса
// window.balanceUI = window.balanceUI || new BalanceUI();

class App {
    router: Router;

    constructor() {
        this.router = new Router();
        this.router.init();

    }
}

(new App());