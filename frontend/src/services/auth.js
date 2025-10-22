import config from "../../config/config.js";

console.log('%c✅ auth.js успешно подключён!', 'color: green; font-size: 16px;');

export class Auth {
    static accessTokenKey = 'accessToken';
    static refreshTokenKey = 'refreshToken';
    static userInfoKey = 'userInfo';
    static userListKey = 'userList';
    static router = null; // 👈 чтобы использовать navigate

    /**
     * Позволяет передать router при инициализации
     * @param {Object} router - экземпляр роутера
     */
    static init(router) {
        this.router = router;
    }

    /**
     * Обрабатывает 401 ответ и пробует обновить токен
     * @returns {Promise<boolean>}
     */
    static async processUnauthorizedResponse() {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) {
            this.handleLogoutRedirect();
            return false;
        }

        try {
            const response = await fetch(`${config.host}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                console.warn('⚠️ Не удалось обновить токен. Статус:', response.status);
                this.handleLogoutRedirect();
                return false;
            }

            const result = await response.json();
            if (result.error || !result.accessToken) {
                console.error('❌ Ошибка обновления токена:', result.message);
                this.handleLogoutRedirect();
                return false;
            }

            this.setTokens(result.accessToken, result.refreshToken);
            return true;
        } catch (err) {
            console.error('❌ Ошибка при обновлении токена:', err);
            this.handleLogoutRedirect();
            return false;
        }
    }

    /**
     * Разлогинивает пользователя
     * @returns {Promise<boolean>}
     */
    static async logout() {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) {
            this.handleLogoutRedirect();
            return false;
        }

        try {
            const response = await fetch(`${config.host}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                console.warn('⚠️ Сервер не ответил корректно при logout');
                return false;
            }

            const result = await response.json();
            if (result.error) {
                console.error('Ошибка при logout:', result.message);
                return false;
            }

            this.clearAuthData();
            this.navigateTo('/');
            return true;
        } catch (err) {
            console.error('❌ Ошибка при logout:', err);
            return false;
        }
    }

    // ==============================
    // === Работа с токенами и userInfo
    // ==============================

    static setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    static removeTokens() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
    }

    static setUserInfo(info) {
        localStorage.setItem(this.userInfoKey, JSON.stringify(info));
    }

    static getUserInfo() {
        try {
            return JSON.parse(localStorage.getItem(this.userInfoKey)) || null;
        } catch {
            return null;
        }
    }

    static getUserEmail() {
        return this.getUserInfo()?.email || null;
    }

    static saveUserToList(user) {
        try {
            const users = JSON.parse(localStorage.getItem(this.userListKey)) || [];
            if (!users.some(u => u.email === user.email)) {
                users.push(user);
                localStorage.setItem(this.userListKey, JSON.stringify(users));
            }
        } catch (err) {
            console.error('Ошибка при сохранении пользователя в список:', err);
        }
    }

    /**
     * Полная очистка данных авторизации
     */
    static clearAuthData() {
        this.removeTokens();
        localStorage.removeItem(this.userInfoKey);
    }

    // ==============================
    // === Вспомогательные методы
    // ==============================

    static navigateTo(path) {
        if (this.router && typeof this.router.navigate === 'function') {
            this.router.navigate(path);
        } else {
            console.warn('⚠️ Router не инициализирован, используется fallback через location.href');
            location.href = `#${path}`;
        }
    }

    static handleLogoutRedirect() {
        this.clearAuthData();
        this.navigateTo('/');
    }
}
