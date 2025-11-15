import { SessionManager } from "@/utils/session-manager";
import { CustomHttp } from "@/services/custom-http";
import config from "@/config/config";
import {Operation} from "@/types/operation.type";
import {HttpErrorType} from "@/types/http-error.type";

console.log('%c✅ balance.ts успешно подключён!', 'color: green; font-size: 16px;');

export class BalanceUI {
    readonly balanceEl: HTMLElement | null;
    readonly userId: number | null;

    constructor() {
        this.balanceEl = document.getElementById('userBalance');
        this.userId = SessionManager.getUserId();

        if (!this.balanceEl || !this.userId) return;
        void this.updateUserBalance();
    }

    public async updateUserBalance(): Promise<void> {
        if (!this.balanceEl || !this.userId) return;

        console.log('Updating user balance...');

        try {
            // теперь всегда загружаем all операции
            const fetchedOps: Operation[] | HttpErrorType  = await CustomHttp.request<Operation[]>(
                `${config.host}/operations?period=all`
            );

            if ((fetchedOps as HttpErrorType).error || !Array.isArray(fetchedOps)) {
                console.warn('Ошибка при получении операций:', fetchedOps);
                this.balanceEl.textContent = '$0.00';
                return;
            }

            const ops: Operation[] = fetchedOps;

            const totalIncome: number = ops
                .filter((op: Operation): boolean => op.type === 'income')
                .reduce((sum: number, op: Operation): number => sum + Number(op.amount), 0);

            const totalExpense: number = ops
                .filter((op: Operation): boolean => op.type === 'expense')
                .reduce((sum: number, op: Operation): number => sum + Number(op.amount), 0);

            const finalBalance: number = totalIncome - totalExpense;

            console.log('Final balance =', finalBalance);

            this.balanceEl.textContent = `$${finalBalance.toFixed(2)}`;
        } catch (err) {
            console.error('Ошибка при загрузке баланса:', err);
            this.balanceEl.textContent = '$0.00';
        }
    }
}

















