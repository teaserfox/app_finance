import { Auth } from "./auth";
import {HttpErrorType} from "@/types/http-error.type";
import {RequestHeadersType} from "@/types/request-headers.type";
import {RequestBodyType} from "@/types/request-body.type";

console.log('%c✅ custom-http.ts успешно подключён!', 'color: green; font-size: 16px;');

export class CustomHttp {
    /**
     * Универсальный метод HTTP-запроса
     * @param url - полный URL
     * @param method - GET, POST, PUT, DELETE
     * @param body - тело запроса
     * @param headers - дополнительные заголовки
     * @returns результат типа T или HttpError
     */
    static async request<TResponse, TRequest = unknown>(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: RequestBodyType<TRequest>,
        headers: RequestHeadersType = {}
    ): Promise<TResponse | HttpErrorType> {
        const params: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers,
            },
        };

        // Токен всегда в headers
        const token: string | null = localStorage.getItem(Auth.accessTokenKey);
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

        let data: unknown = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // Обработка 401
        if (response.status === 401) {
            console.warn('🔄 Получен 401 — обновляем токен...');
            const refreshed: boolean = await Auth.processUnauthorizedResponse();
            if (refreshed) {
                return await this.request<TResponse, TRequest>(url, method, body, headers);
            }

            console.warn('🚫 Refresh не удалось — redirect → /login');
            Auth.navigateTo('/login');
            return { error: true, message: "Unauthorized" };
        }

        // Другие ошибки HTTP
        if (!response.ok) {
            return (data ?? { error: true, message: `HTTP Error ${response.status}` }) as HttpErrorType;
        }

        // ✅ Всё ок — возвращаем данные как TResponse
        return data as TResponse;
    }
}




