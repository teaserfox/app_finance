import { CustomHttp } from '@/services/custom-http.js';
import config from '../../config/config.js';

export class IncomeCategoryAPI {
    static baseUrl = `${config.host}/category-income`;

    /** 📜 Получить все категории доходов */
    static async getAll() {
        return await CustomHttp.request(this.baseUrl, 'GET');
    }

    /** 🔍 Получить одну категорию по ID */
    static async getById(id) {
        return await CustomHttp.request(`${this.baseUrl}/${id}`, 'GET');
    }

    /** ➕ Создать новую категорию доходов */
    static async create(title) {
        return await CustomHttp.request(this.baseUrl, 'POST', { title });
    }

    /** ✏️ Обновить категорию доходов */
    static async update(id, title) {
        return await CustomHttp.request(`${this.baseUrl}/${id}`, 'PUT', { title });
    }

    /** ❌ Удалить категорию доходов */
    static async delete(id) {
        return await CustomHttp.request(`${this.baseUrl}/${id}`, 'DELETE');
    }
}
