import config from "../../config/config.js";

console.log('%c✅ auth.js успешно подключён!', 'color: green; font-size: 16px;');

export class Auth {
    static accessTokenKey = 'accessToken';
    static refreshTokenKey = 'refreshToken';
    static userInfoKey = 'userInfo';

    static async processUnauthorizedResponse() {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);

        return refreshToken
            ? (await (async () => {
                const response = await fetch(`${config.host}/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken })
                });

                return response?.status === 200
                    ? ((result => (
                        !result.error
                            ? (this.setTokens(result.accessToken, result.refreshToken), true)
                            : (this.removeTokens(), location.href = '#/', false)
                    ))(await response.json()))
                    : (this.removeTokens(), location.href = '#/', false);
            })())
            : (this.removeTokens(), location.href = '#/', false);
    }


    static async logout() {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) return;

        const response = await fetch(`${config.host}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
        });

        if (!response || response.status !== 200) return;

        const result = await response.json();

        return (result && !result.error)
            ? (this.removeTokens(), localStorage.removeItem(this.userInfoKey), true)
            : false;
    }


    static setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    static removeTokens() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
    }

    static setUserInfo(info) {
        localStorage.setItem(this.userInfoKey, JSON.stringify(info));
    }

    static getUserInfo() {
        const userInfo = localStorage.getItem(this.userInfoKey);
        return userInfo ? JSON.parse(userInfo) : null;
    }

    static getUserEmail() {
        const userInfo = this.getUserInfo();
        return userInfo?.email || null;
    }
}