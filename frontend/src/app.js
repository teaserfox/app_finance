import './scss/styles.scss';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

import {Router} from "./router.js";

console.log('%c✅ app.js выполняется!', 'color: green; font-weight: bold;');

class App {
    constructor() {
        this.router = new Router();
        this.router.init();

    }
}

(new App());