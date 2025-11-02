import { CustomHttp } from "@/services/custom-http.js";
import config from "../../config/config.js";

export class OperationsService {
    /**
     * Загрузка операций с сервера
     * @param {string} period - today | week | month | year | all | interval
     * @param {string|null} dateFrom - для интервала
     * @param {string|null} dateTo - для интервала
     * @returns {Promise<Array>} - массив операций
     */
    static async load(period = 'all', dateFrom = null, dateTo = null) {
        try {
            let url = `${config.host}/operations?period=${period}`;
            if (period === 'interval' && dateFrom && dateTo) {
                url += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
            }
            const response = await CustomHttp.request(url);
            return Array.isArray(response) ? response : [];
        } catch (err) {
            console.error('❌ Ошибка при загрузке операций:', err.message);
            return [];
        }
    }
}
