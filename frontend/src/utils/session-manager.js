// src/utils/session-manager.js
import { Auth } from '@/services/auth';
import config from '../../config/config.js';

console.log('%c✅ session-manager.js успешно подключён!', 'color: green; font-size: 16px;');

export class SessionManager {

    /** 🚪 Выход пользователя (без удаления из списка зарегистрированных) */
    static async handleLogout() {
        try {
            const refreshToken = localStorage.getItem(Auth.refreshTokenKey);
            const userInfo = JSON.parse(localStorage.getItem(Auth.userInfoKey) || '{}');
            const users = JSON.parse(localStorage.getItem('users')) || [];

            // === 1. Отправляем logout-запрос, если есть refreshToken ===
            if (refreshToken) {
                await fetch(`${config.host}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }

            // === 2. Если пользователь есть — обновляем его токены в списке ===
            if (userInfo.userId) {
                const idx = users.findIndex(u => u.id === userInfo.userId);
                if (idx !== -1) {
                    users[idx].tokens = null; // обнуляем токены, чтобы логин был заново
                } else {
                    // если впервые — добавляем в систему (на случай, если register не сохранил)
                    users.push({
                        id: userInfo.userId,
                        fullName: userInfo.fullName,
                        email: userInfo.email,
                        tokens: null,
                    });
                }
                localStorage.setItem('users', JSON.stringify(users));
            }

            // === 3. Удаляем только активные токены и текущего пользователя ===
            Auth.removeTokens();
            localStorage.removeItem(Auth.userInfoKey);
            localStorage.removeItem('currentUserId');

            // === 4. Редирект на страницу регистрации ===
            window.location.hash = '#/signup';
            console.log(`👋 ${userInfo.fullName || 'Пользователь'} вышел из системы. Аккаунт сохранён.`);

        } catch (err) {
            console.error('❌ Ошибка при выходе:', err);
            window.location.hash = '#/signup';
        }
    }

    /** 💾 Установка активного пользователя (при login или signup) */
    static setCurrentUser(userInfo) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const idx = users.findIndex(u => u.id === userInfo.userId);

        const userData = {
            id: userInfo.userId,
            fullName: userInfo.fullName,
            email: userInfo.email,
            tokens: {
                accessToken: localStorage.getItem(Auth.accessTokenKey),
                refreshToken: localStorage.getItem(Auth.refreshTokenKey),
            },
        };

        if (idx !== -1) {
            users[idx] = userData;
        } else {
            users.push(userData);
        }

        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUserId', userInfo.userId);
        localStorage.setItem(Auth.userInfoKey, JSON.stringify(userInfo));

        console.log(`✅ Активен пользователь: ${userInfo.fullName}`);
    }

    /** 📋 Список всех пользователей */
    static getAllUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    /** 👤 Текущий пользователь */
    static getCurrentUser() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const id = localStorage.getItem('currentUserId');
        return users.find(u => String(u.id) === String(id)) || null;
    }
}
