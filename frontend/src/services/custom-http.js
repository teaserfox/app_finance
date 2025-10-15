import {Auth} from "./auth.js";

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

        const response = await fetch(url, params);

        if (response.status < 200 || response.status >= 300) {
            return response.status === 401
                ? (await Auth.processUnauthorizedResponse())
                    ? (console.log('URL:', url, 'Method:', method, 'Body:', body) &&
                        await this.request(url, method, body))
                    : (console.error('Unauthorized, refresh failed') && null)
                : null;
        }

        return await response.json();
    }
}