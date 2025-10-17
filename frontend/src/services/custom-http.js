import {Auth} from "./auth.js";

console.log('%c✅ custom.js успешно подключён!', 'color: green; font-size: 16px;');

export class CustomHttp {
    static async request(url, method = "GET", body = null) {

        const params = {
            method: method,
            headers:{
                'Content-type': 'application/json',
                'Accept': 'application/json',
            },
        };

        let token = localStorage.getItem(Auth.accessTokenKey);

        token ? params.headers['x-access-token'] = token : null;
        body ? params.body = JSON.stringify(body) : null;

        let response;
        console.log('📦 Тело запроса:', body);


        try {
            response = await fetch(url, params);
        } catch (e) {
            console.error('❌ Ошибка соединения с сервером:', e);
            return { error: true, message: "Сервер недоступен" };
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (response.status === 401) {
            const refreshed = await Auth.processUnauthorizedResponse();
            if (refreshed) {
                console.log('♻️ Повторный запрос после refresh:', url);
                return await this.request(url, method, body);
            }
            return { error: true, message: "Unauthorized" };
        }

        if (response.status < 200 || response.status >= 300) {
            return data || { error: true, message: `HTTP Error ${response.status}` };
        }

        return data;

        // if (response.status < 200 || response.status >= 300) {
        //     return response.status === 401
        //         ? (await Auth.processUnauthorizedResponse())
        //             ? (console.log('URL:', url, 'Method:', method, 'Body:', body) &&
        //                 await this.request(url, method, body))
        //             : (console.error('Unauthorized, refresh failed') && null)
        //         : null;
        // }

        // return await response.json();
    }
}