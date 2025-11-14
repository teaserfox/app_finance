import config from "@/config/config";
import { Router } from "@/router";
import { Tokens, User, LoginResponse } from "@/types/token-user-login.type";

console.log('%c✅ auth.ts успешно подключён!', 'color: green; font-size: 16px;');

export class Auth {
    static accessTokenKey: string = 'accessToken';
    static refreshTokenKey: string = 'refreshToken';
    static userInfoKey: string = 'userInfo';
    static userListKey: string = 'userList';

    static router: Router | null = null;

    /** Подключение router */
    static init(router: Router): void {
        this.router = router;
    }

    /** Обновление токена при 401 */
    static async processUnauthorizedResponse(): Promise<boolean> {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) {
            this.handleLogoutRedirect();
            return false;
        }

        try {
            const response = await fetch(`${config.host}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                console.warn('⚠️ Refresh token error:', response.status);
                this.handleLogoutRedirect();
                return false;
            }

            const result: LoginResponse = await response.json();

            if (!result.tokens?.accessToken || !result.tokens?.refreshToken) {
                console.error('❌ Ошибка обновления токена:', result.message);
                this.handleLogoutRedirect();
                return false;
            }

            this.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
            if (result.user) this.setUserInfo(result.user);
            return true;
        } catch (err) {
            console.error('❌ Ошибка refresh запроса:', err);
            this.handleLogoutRedirect();
            return false;
        }
    }

    /** Logout */
    static async logout(): Promise<boolean> {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) {
            this.handleLogoutRedirect();
            return false;
        }

        try {
            const response = await fetch(`${config.host}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            const result: LoginResponse = await response.json();
            if (!response.ok || result.error) {
                console.warn('⚠️ Logout failed:', result.message || response.statusText);
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
    // Работа с токенами
    // ==============================
    static setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    static removeTokens(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
    }

    // ==============================
    // Работа с User Info
    // ==============================
    static setUserInfo(info: User): void {
        localStorage.setItem(this.userInfoKey, JSON.stringify(info));
    }

    static getUserInfo(): User | null {
        try {
            return JSON.parse(localStorage.getItem(this.userInfoKey) || "null");
        } catch {
            return null;
        }
    }

    static getUserEmail(): string | null {
        return this.getUserInfo()?.email || null;
    }

    static saveUserToList(user: User): void {
        try {
            const users: User[] = JSON.parse(localStorage.getItem(this.userListKey) || "[]");
            if (!users.some(u => u.email === user.email)) {
                users.push(user);
                localStorage.setItem(this.userListKey, JSON.stringify(users));
            }
        } catch (err) {
            console.error('Ошибка сохранения userList:', err);
        }
    }

    // ==============================
    // Навигация
    // ==============================
    static navigateTo(path: string): void {
        if (this.router?.navigate) {
            this.router.navigate(path);
        } else {
            console.warn('⚠️ Router не инициализирован → fallback');
            location.href = `#${path}`;
        }
    }

    /** Удаление данных + редирект */
    static clearAuthData(): void {
        this.removeTokens();
        localStorage.removeItem(this.userInfoKey);
    }

    static handleLogoutRedirect(): void {
        this.clearAuthData();
        this.navigateTo('/');
    }
}


