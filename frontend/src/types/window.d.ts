// window.d.ts
import { BalanceUI } from "@/js/balance";

// Расширяем глобальный объект window
export {};

declare global {
    interface Window {
        balanceUI?: BalanceUI;
    }
}