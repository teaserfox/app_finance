import { SessionManager } from "@/utils/session-manager.js";
import { CustomHttp } from "@/services/custom-http.js";
import config from "../../config/config.js";

console.log('%c✅ balance.js успешно подключён!', 'color: green; font-size: 16px;');

export class BalanceUI {
    constructor() {
        this.balanceEl = document.getElementById('userBalance');
        this.userId = SessionManager.getUserId();

        console.log('BalanceUI initialized, userId:', this.userId, 'balanceEl:', this.balanceEl);

        if (!this.balanceEl || !this.userId) return;

        this.updateUserBalance();
    }

    async updateUserBalance() {
        console.log('Updating user balance...');

        try {
            // Запрашиваем доходы
            console.log('Fetching incomes from backend...');
            const fetchedIncomes = await CustomHttp.request(`${config.host}/operations?type=income&user_id=${this.userId}`);
            console.log('Incomes fetched:', fetchedIncomes);

            // Запрашиваем расходы
            console.log('Fetching expenses from backend...');
            const fetchedExpenses = await CustomHttp.request(`${config.host}/operations?type=expense&user_id=${this.userId}`);
            console.log('Expenses fetched:', fetchedExpenses);

            // Если fetch вернул ошибку, логируем и прекращаем
            if (fetchedIncomes.error || fetchedExpenses.error) {
                console.warn('Ошибка при получении операций. incomes:', fetchedIncomes, 'expenses:', fetchedExpenses);
                this.balanceEl.textContent = '$0.00';
                return;
            }

            // Фильтруем данные по типу
            const incomes = fetchedIncomes.filter(op => op.type === 'income');
            const expenses = fetchedExpenses.filter(op => op.type === 'expense');

            console.log('Incomes raw data:', incomes);
            console.log('Expenses raw data:', expenses);
            console.log('Первый доход:', incomes[0]);
            console.log('Первый расход:', expenses[0]);

            // Считаем суммы
            const totalIncome = incomes.reduce((sum, op) => sum + Number(op.amount), 0);
            const totalExpense = expenses.reduce((sum, op) => sum + Number(op.amount), 0);

            console.log('Total income:', totalIncome, 'Total expense:', totalExpense);

            const finalBalance = totalIncome - totalExpense;
            console.log('Final balance to display:', finalBalance);

            this.balanceEl.textContent = `$${finalBalance}`;
        } catch (err) {
            console.error('Ошибка при загрузке баланса:', err);
            this.balanceEl.textContent = '$0.00';
        }
    }
}







