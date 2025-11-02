import { Auth } from '@/services/auth';
import { navigate } from '@/router.js';
import config from '../../config/config.js';

console.log('%c✅ session-manager.js подключён!', 'color: green; font-size: 16px;');

export class SessionManager {

    // 🔹 массив подписчиков на изменение текущего пользователя
    static _subscribers = [];

    // === 🔒 Приватные методы для безопасного доступа к localStorage ===
    static _safeGet(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            console.warn(`⚠️ Повреждён localStorage ключ: ${key}`);
            return fallback;
        }
    }

    static _safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`❌ Не удалось сохранить ${key}:`, e);
        }
    }

    static _getUsers() {
        return this._safeGet('users', []);
    }

    static _saveUsers(users) {
        this._safeSet('users', users);
    }

    // 🔹 подписка на смену пользователя
    static subscribe(callback) {
        if (typeof callback === 'function') {
            this._subscribers.push(callback);
        }
    }

    // 🔹 уведомление всех подписчиков о смене пользователя
    static _notify() {
        this._subscribers.forEach(cb => {
            try { cb(this.getCurrentUser()); }
            catch (err) { console.error('Ошибка в subscriber callback:', err); }
        });
    }

    // === 🚪 Выход пользователя ===
    static async handleLogout() {
        try {
            const refreshToken = localStorage.getItem(Auth.refreshTokenKey);
            const userInfo = this._safeGet(Auth.userInfoKey, {});
            const users = this._getUsers();

            if (refreshToken) {
                const res = await fetch(`${config.host}/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Logout failed');
                }
            }

            if (userInfo.userId) {
                const idx = users.findIndex(u => u.id === userInfo.userId);
                if (idx !== -1) {
                    users[idx].tokens = null;
                } else {
                    users.push({
                        id: userInfo.userId,
                        fullName: userInfo.fullName,
                        email: userInfo.email,
                        tokens: null,
                    });
                }
                this._saveUsers(users);
            }

            Auth.removeTokens();
            localStorage.removeItem(Auth.userInfoKey);
            localStorage.removeItem('currentUserId');

            // 🔹 уведомляем подписчиков о выходе
            this._notify();

            navigate('/login');
            console.log(`👋 ${userInfo.fullName || 'Пользователь'} вышел из системы`);

        } catch (err) {
            console.error('❌ Ошибка при выходе:', err);
            navigate('/signup');
        }
    }

    // === 💾 Установка активного пользователя ===
    static setCurrentUser(userInfo) {
        const users = this._getUsers();
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

        if (idx !== -1) users[idx] = userData;
        else users.push(userData);

        this._saveUsers(users);
        localStorage.setItem('currentUserId', userInfo.userId);
        this._safeSet(Auth.userInfoKey, userInfo);

        console.log(`✅ Активен пользователь: ${userInfo.fullName}`);

        // 🔹 уведомляем подписчиков о смене пользователя
        this._notify();
    }

    // === 📋 Все пользователи ===
    static getAllUsers() {
        return this._getUsers();
    }

    // === 👤 Текущий пользователь ===
    static getCurrentUser() {
        const users = this._getUsers();
        const id = localStorage.getItem('currentUserId');
        return users.find(u => String(u.id) === String(id)) || null;
    }

    // === 🧩 Получение ID текущего пользователя ===
    static getUserId() {
        const current = this.getCurrentUser();
        return current?.id || null;
    }

    // === 🧩 Инициализация UI ===
    static initUserUI() {
        const userDiv = document.getElementById('user');
        const current = this.getCurrentUser();

        if (userDiv && current?.fullName) {
            userDiv.textContent = current.fullName;
            console.log(`👤 Текущий пользователь: ${current.fullName}`);
        } else {
            console.warn('⚠️ Нет данных пользователя — перенаправляем на login');
            navigate('/login');
        }
        return userDiv;
    }
}



