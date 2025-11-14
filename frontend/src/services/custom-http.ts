import { Auth } from "./auth";

console.log('%c✅ custom-http.ts успешно подключён!', 'color: green; font-size: 16px;');

export interface HttpError {
    error: true;
    message: string;
}

export class CustomHttp {
    /**
     * Универсальный метод HTTP-запроса
     * @param url - полный URL
     * @param method - GET, POST, PUT, DELETE
     * @param body - тело запроса
     * @param headers - дополнительные заголовки
     * @returns результат типа T или HttpError
     */
    static async request<T = any>(
        url: string,
        method: string = "GET",
        body: Record<string, any> | null = null,
        headers: Record<string, string> = {}
    ): Promise<T | HttpError> {
        // создаём базовые headers
        const params: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers, // любые дополнительные заголовки
            },
        };

        // Гарантируем, что токен всегда в headers
        const token = localStorage.getItem(Auth.accessTokenKey);
        if (token) {
            (params.headers as Record<string, string>)['x-auth-token'] = token;
        }

        if (body) {
            params.body = JSON.stringify(body);
        }

        console.log(`📦 ${method} ${url}`, body ? `→ body: ${JSON.stringify(body)}` : '', headers);

        let response: Response;
        try {
            response = await fetch(url, params);
        } catch (err) {
            console.error('❌ Ошибка соединения с сервером:', err);
            return { error: true, message: "Сервер недоступен" };
        }

        let data: T | HttpError | null = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // обработка 401 — пробуем обновить токен
        if (response.status === 401) {
            console.warn('🔄 Получен 401 — обновляем токен...');
            const refreshed = await Auth.processUnauthorizedResponse();
            if (refreshed) {
                return await this.request<T>(url, method, body, headers);
            }

            console.warn('🚫 Refresh не удалось — redirect → /login');
            Auth.navigateTo('/login');
            return { error: true, message: "Unauthorized" };
        }

        // другие ошибки HTTP
        if (!response.ok) {
            return (data ?? { error: true, message: `HTTP Error ${response.status}` });
        }

        // ✅ Всё ок — возвращаем данные как T
        return data as T;
    }
}




