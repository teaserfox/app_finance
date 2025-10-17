import config from "../../config/config.js";
import { Auth } from "../services/auth.js";

console.log('%c✅ UserManager.js успешно подключён!', 'color: green; font-size: 16px;');

// src/utils/url-manager.js

export class UserManager {

    // === Получение query-параметров из хэша ===
    static getQueryParams() {
        const hash = document.location.hash.split('+').join(' ');
        const params = {};
        const re = /[?&]([^=]+)=([^&]*)/g;
        let match;

        while (match = re.exec(hash)) {
            const key = decodeURIComponent(match[1]).toLowerCase();
            params[key] = decodeURIComponent(match[2]);
        }

        // Подтягиваем недостающие данные из localStorage
        if (!params.name || !params.lastName || !params.email) {
            const stored = localStorage.getItem(Auth.userInfoKey);
            if (stored) {
                const userData = JSON.parse(stored);
                // Поддержка как fullName, так и name/lastName
                if (userData.fullName && (!params.name || !params.lastName)) {
                    const [name, lastName] = userData.fullName.split(' ');
                    if (!params.name) params.name = name;
                    if (!params.lastName) params.lastName = lastName || '';
                }

                if (!params.email && userData.email) params.email = userData.email;
            }
        }

        return params;
    }

    // === Проверка данных пользователя и редирект при их отсутствии ===
    static checkUserData(params) {
        if (!params.name || !params.lastName || !params.email) {
            console.warn('⚠️ Недостаточно данных пользователя. Перенаправление на login...');
            window.location.hash = '#/login';
            return false;
        }
        return true;
    }

    // === Получение данных пользователя с проверкой ===
    static getUserDataOrRedirect() {
        const params = UserManager.getQueryParams();
        const valid = UserManager.checkUserData(params);
        return valid ? params : null;
    }

    // === Инициализация блока пользователя и logout ===
    static initUserUI() {
        const userData = UserManager.getUserDataOrRedirect();
        if (!userData) return;

        const userBlock = document.getElementById('user');
        const logoutLink = document.querySelector('.dropdown-item[href="#logout"]');

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
    static async handleLogout() {
        try {
            const refreshToken = localStorage.getItem(Auth.refreshTokenKey);
            if (!refreshToken) {
                console.warn('⚠️ Refresh token не найден.');
                Auth.removeTokens();
                localStorage.removeItem(Auth.userInfoKey);
                window.location.hash = '#/signup';
                return;
            }

            const response = await fetch(`${config.host}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                console.log('✅ Выход успешно выполнен через API.');
            } else {
                console.warn('⚠️ Ошибка при logout на сервере.');
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

