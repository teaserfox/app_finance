import { SessionManager } from "@/utils/session-manager";
import { CustomHttp, HttpError } from "@/services/custom-http";
import config from "@/config/config";

console.log('%c✅ balance.ts успешно подключён!', 'color: green; font-size: 16px;');

export interface Operation {
    id: number;
    type: 'income' | 'expense';
    amount: number | string;
    [key: string]: any;
}

export class BalanceUI {
    private balanceEl: HTMLElement | null;
    private userId: number | null;

    constructor() {
        this.balanceEl = document.getElementById('userBalance');
        this.userId = SessionManager.getUserId();

        console.log('BalanceUI initialized, userId:', this.userId, 'balanceEl:', this.balanceEl);

        if (!this.balanceEl || !this.userId) return;

        this.updateUserBalance();
    }

    async updateUserBalance(): Promise<void> {
        if (!this.balanceEl || !this.userId) return;

        console.log('Updating user balance...');

        try {
            // Запрашиваем доходы
            console.log('Fetching incomes from backend...');
            const fetchedIncomes = await CustomHttp.request<Operation[]>(
                `${config.host}/operations?type=income&user_id=${this.userId}`
            );
            console.log('Incomes fetched:', fetchedIncomes);

            // Запрашиваем расходы
            console.log('Fetching expenses from backend...');
            const fetchedExpenses = await CustomHttp.request<Operation[]>(
                `${config.host}/operations?type=expense&user_id=${this.userId}`
            );
            console.log('Expenses fetched:', fetchedExpenses);

            // Проверка на ошибки
            if ((fetchedIncomes as HttpError).error || (fetchedExpenses as HttpError).error) {
                console.warn('Ошибка при получении операций. incomes:', fetchedIncomes, 'expenses:', fetchedExpenses);
                this.balanceEl.textContent = '$0.00';
                return;
            }

            // Фильтруем операции
            const incomes: Operation[] = Array.isArray(fetchedIncomes)
                ? fetchedIncomes.filter(op => op.type === 'income')
                : [];
            const expenses: Operation[] = Array.isArray(fetchedExpenses)
                ? fetchedExpenses.filter(op => op.type === 'expense')
                : [];

            console.log('Incomes:', incomes);
            console.log('Expenses:', expenses);

            // Суммируем
            const totalIncome = incomes.reduce((sum, op) => sum + Number(op.amount), 0);
            const totalExpense = expenses.reduce((sum, op) => sum + Number(op.amount), 0);

            const finalBalance = totalIncome - totalExpense;
            console.log('Final balance to display:', finalBalance);

            this.balanceEl.textContent = `$${finalBalance.toFixed(2)}`;
        } catch (err) {
            console.error('Ошибка при загрузке баланса:', err);
            this.balanceEl.textContent = '$0.00';
        }
    }
}
















