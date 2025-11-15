import { Auth } from '@/services/auth';
import { navigate } from '@/router';
import config from '@/config/config';
import {StoredUserType, StoredUserWithTokens} from '@/types/stored-user.type';



export class SessionManager {
    // 🔹 массив подписчиков на изменение текущего пользователя
    private static _subscribers: Array<(user: StoredUserType | null) => void> = [];

    // === 🔒 Приватные методы для безопасного доступа к localStorage ===
    private static _safeGet<T>(key: string, fallback: T): T {
        try {
            const value: string | null = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            console.warn(`⚠️ Повреждён localStorage ключ: ${key}`);
            return fallback;
        }
    }

    private static _safeSet<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`❌ Не удалось сохранить ${key}:`, e);
        }
    }

    private static _getUsers(): StoredUserWithTokens[] {
        return this._safeGet<StoredUserWithTokens[]>('users', []);
    }

    private static _saveUsers(users: StoredUserWithTokens[]): void {
        this._safeSet('users', users);
    }

    // 🔹 подписка на смену пользователя
    static subscribe(callback: (user: StoredUserType | null) => void): void {
        if (typeof callback === 'function') this._subscribers.push(callback);
    }

    // 🔹 уведомление всех подписчиков о смене пользователя
    private static _notify(): void {
        this._subscribers.forEach(cb => {
            try { cb(this.getCurrentUser()); }
            catch (err) { console.error('Ошибка в subscriber callback:', err); }
        });
    }

    // === 🚪 Выход пользователя ===
    static async handleLogout(): Promise<void> {
        try {
            const refreshToken: string | null = localStorage.getItem(Auth.refreshTokenKey);
            const userInfo: {} | StoredUserType = this._safeGet<StoredUserType | {}>(Auth.userInfoKey, {});
            const users: StoredUserWithTokens[] = this._getUsers();

            if ('userId' in userInfo) {
                const existingUser: StoredUserWithTokens | undefined = users.find((u: StoredUserWithTokens): boolean =>
                    u.userId === userInfo.userId);

                if (existingUser) {
                    existingUser.tokens = null;
                } else {
                    users.push({
                        userId: userInfo.userId,
                        fullName: userInfo.fullName,
                        email: userInfo.email,
                        tokens: null,
                    });
                }

                this._saveUsers(users);
            }

            if (refreshToken) {
                const res: Response = await fetch(`${config.host}/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Logout failed');
                }
            }

            Auth.removeTokens();
            localStorage.removeItem(Auth.userInfoKey);
            localStorage.removeItem('currentUserId');

            this._notify();

            navigate('/login');
            console.log(`👋 ${(userInfo as StoredUserType).fullName || 'Пользователь'} вышел из системы`);
        } catch (err) {
            console.error('❌ Ошибка при выходе:', err);
            navigate('/signup');
        }
    }

    // === 💾 Установка активного пользователя ===
    static setCurrentUser(userInfo: StoredUserType): void {
        const users: StoredUserWithTokens[] = this._getUsers();
        const idx: number = users.findIndex((u: StoredUserWithTokens): boolean => u.userId === userInfo.userId);

        const userData: StoredUserWithTokens = {
            ...userInfo,
            tokens: {
                accessToken: localStorage.getItem(Auth.accessTokenKey) || '',
                refreshToken: localStorage.getItem(Auth.refreshTokenKey) || '',
            }
        };

        if (idx >= 0) users[idx] = userData;
        else users.push(userData);

        this._saveUsers(users);
        localStorage.setItem('currentUserId', String(userInfo.userId));
        this._safeSet(Auth.userInfoKey, userInfo);

        console.log(`✅ Активен пользователь: ${userInfo.fullName}`);

        this._notify();
    }

    // === 📋 Все пользователи ===
    static getAllUsers(): StoredUserWithTokens[] {
        return this._getUsers();
    }

    // === 👤 Текущий пользователь ===
    static getCurrentUser(): StoredUserType | null {
        const users: StoredUserWithTokens[] = this._getUsers();
        const id: string | null = localStorage.getItem('currentUserId');
        return users.find((u: StoredUserWithTokens): boolean => String(u.userId) === String(id)) || null;
    }

    // === 🧩 Получение ID текущего пользователя ===
    static getUserId(): number | null {
        const current: StoredUserType | null = this.getCurrentUser();
        return current?.userId ?? null;
    }

    // === 🧩 Инициализация UI ===
    static initUserUI(): HTMLElement | null {
        const userDiv: HTMLElement | null = document.getElementById('user');
        const current: StoredUserType | null = this.getCurrentUser();

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





