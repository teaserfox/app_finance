import { Auth } from "./auth.js";

console.log('%c✅ custom-http.js успешно подключён!', 'color: green; font-size: 16px;');

export class CustomHttp {
    /**
     * Универсальный метод HTTP-запроса
     * @param {string} url - полный путь (включая config.host)
     * @param {string} method - метод запроса (GET, POST, PUT, DELETE)
     * @param {Object|null} body - тело запроса, если нужно
     * @returns {Promise<Object>} - результат в формате JSON
     */
    static async request(url, method = "GET", body = null) {
        const params = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        // Добавляем токен, если он есть
        const token = localStorage.getItem(Auth.accessTokenKey);
        if (token) params.headers['x-access-token'] = token;

        if (body) params.body = JSON.stringify(body);

        console.log(`📦 ${method} ${url}`, body ? `→ body: ${JSON.stringify(body)}` : '');

        let response;
        try {
            response = await fetch(url, params);
        } catch (e) {
            console.error('❌ Ошибка соединения с сервером:', e);
            return { error: true, message: "Сервер недоступен" };
        }

        // Попытка прочитать JSON (даже при ошибках сервера)
        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // ⚠️ Обработка 401 (токен истёк)
        if (response.status === 401) {
            console.warn('🔄 Получен 401. Пытаемся обновить токен...');
            const refreshed = await Auth.processUnauthorizedResponse();

            if (refreshed) {
                console.log('♻️ Повторный запрос после успешного refresh:', url);
                return await this.request(url, method, body); // повторяем запрос
            }

            console.error('🚫 Refresh токена не удался, перенаправление на /login');
            Auth.navigateTo('/login');
            return { error: true, message: "Unauthorized" };
        }

        // ⚠️ Обработка других ошибок HTTP
        if (!response.ok) {
            console.warn(`⚠️ HTTP ${response.status}:`, data || response.statusText);
            return data || { error: true, message: `HTTP Error ${response.status}` };
        }

        // ✅ Всё ок
        return data;
    }
}
