export class Navigate {
    /** 📍 Переход по hash-маршруту */
    static to(path: string): void {
        if (!path.startsWith('#/')) path = `#/${path}`;
        window.location.hash = path;
    }

    /** 🔙 Назад */
    static back(): void {
        window.history.back();
    }

    /** 🏠 Главная */
    static home(): void {
        this.to('dashboard');
    }

    /** 👛 Доходы */
    static income(): void {
        this.to('income-categories');
    }

    /** 💸 Расходы */
    static expense(): void {
        this.to('expense-categories');
    }

    /** 🚪 Логин */
    static login(): void {
        this.to('login');
    }

    /** 🧾 Регистрация */
    static signup(): void {
        this.to('signup');
    }
}

