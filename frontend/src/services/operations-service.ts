import { CustomHttp } from "@/services/custom-http";
import config from "@/config/config";
import { Operation } from "@/types/operation.type";


export class OperationsService {
    /**
     * Загрузка операций с сервера
     * @param period - today | week | month | year | all | interval
     * @param dateFrom - дата начала интервала
     * @param dateTo - дата конца интервала
     * @returns массив операций
     */
    static async load(
        period: 'today' | 'week' | 'month' | 'year' | 'all' | 'interval' = 'all',
        dateFrom: string | null = null,
        dateTo: string | null = null
    ): Promise<Operation[]> {
        try {
            let url = `${config.host}/operations?period=${period}`;
            if (period === 'interval' && dateFrom && dateTo) {
                url += `&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;
            }

            const response = await CustomHttp.request<Operation[]>(url);
            return Array.isArray(response) ? response : [];
        } catch (err: any) {
            console.error('❌ Ошибка при загрузке операций:', err?.message ?? err);
            return [];
        }
    }
}

