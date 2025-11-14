import config from "@/config/config";
import { Auth } from "@/services/auth";
import { StoredUserType } from "@/types/stored-user.type";
import { User } from "@/types/token-user-login.type";

console.log('%c✅ UserManager.ts успешно подключён!', 'color: green; font-size: 16px;');

export type UserQueryParams = {
    name?: string;
    lastName?: string;
    email?: string;
};

export class UserManager {

    // === Получение query-параметров из хэша ===
    static getQueryParams(): UserQueryParams {
        const hash = document.location.hash.split('+').join(' ');
        const params: UserQueryParams = {};
        const re = /[?&]([^=]+)=([^&]*)/g;
        let match: RegExpExecArray | null;

        while ((match = re.exec(hash))) {
            const rawKey = match[1];
            const rawValue = match[2];

            if (rawKey && rawValue) {
                const key: string = decodeURIComponent(rawKey).toLowerCase();
                const value: string = decodeURIComponent(rawValue);

                if (key === 'name') params.name = value;
                if (key === 'lastname') params.lastName = value;
                if (key === 'email') params.email = value;
            }
        }

        // Подтягиваем недостающие данные из localStorage
        const stored = localStorage.getItem(Auth.userInfoKey);
        if (stored) {
            const userData: StoredUserType = JSON.parse(stored);
            if (userData.fullName && (!params.name || !params.lastName)) {
                const [name, lastName] = userData.fullName.split(' ');
                if (!params.name) params.name = name || '';
                if (!params.lastName) params.lastName = lastName || '';
            }
            if (!params.email && userData.email) params.email = userData.email;
        }

        return params;
    }

    // === Проверка данных пользователя и редирект при их отсутствии ===
    static checkUserData(params: UserQueryParams): boolean {
        if (!params.name || !params.lastName || !params.email) {
            console.warn('⚠️ Недостаточно данных пользователя. Перенаправление на login...');
            window.location.hash = '#/login';
            return false;
        }
        return true;
    }

    // === Получение данных пользователя с проверкой ===
    static getUserDataOrRedirect(): UserQueryParams | null {
        const params = this.getQueryParams();
        const valid = this.checkUserData(params);
        return valid ? params : null;
    }

    // === Инициализация блока пользователя и logout ===
    static initUserUI(): void {
        const userData = this.getUserDataOrRedirect();
        if (!userData) return;

        const userBlock = document.getElementById('user');
        const logoutLink = document.querySelector<HTMLAnchorElement>('.dropdown-item[href="#logout"]');

        // Подставляем имя пользователя
        if (userBlock) {
            const fullName = `${userData.name || ''} ${userData.lastName || ''}`.trim();
            userBlock.textContent = fullName || 'Пользователь';
        }

        // Обработчик выхода
        if (logoutLink) {
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await UserManager.handleLogout();
            });
        }
    }

    // === Выход пользователя из системы ===
    static async handleLogout(): Promise<void> {
        try {
            const refreshToken = localStorage.getItem(Auth.refreshTokenKey);
            if (refreshToken) {
                const response = await fetch(`${config.host}/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (response.ok) {
                    console.log('✅ Выход успешно выполнен через API.');
                } else {
                    console.warn('⚠️ Ошибка при logout на сервере.');
                }
            } else {
                console.warn('⚠️ Refresh token не найден.');
            }
        } catch (err) {
            console.error('❌ Ошибка при выходе:', err);
        } finally {
            Auth.removeTokens();
            localStorage.removeItem(Auth.userInfoKey);
            window.location.hash = '#/signup';
        }
    }
}


