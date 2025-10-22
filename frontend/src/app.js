import './scss/styles.scss';
console.log('%c✅ app.js выполняется!', 'color: green; font-weight: bold;');
import {Router} from "./router.js";
console.log('Router:', Router);

console.log('%c✅ app.js успешно подключён!', 'color: green; font-size: 16px;');


class App {
    constructor() {
        this.router = new Router();
        this.router.init();

    }
}

(new App());