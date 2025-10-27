export class Navigate {
    /** 📍 Переход по hash-маршруту */
    static to(path) {
        if (!path.startsWith('#/')) path = `#/${path}`;
        window.location.hash = path;
    }

    /** 🔙 Назад */
    static back() {
        window.history.back();
    }

    /** 🏠 Главная */
    static home() {
        this.to('dashboard');
    }

    /** 👛 Доходы */
    static income() {
        this.to('income-categories');
    }

    /** 💸 Расходы */
    static expense() {
        this.to('expense-categories');
    }

    /** 🚪 Логин */
    static login() {
        this.to('login');
    }

    /** 🧾 Регистрация */
    static signup() {
        this.to('signup');
    }
}
