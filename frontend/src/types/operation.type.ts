// Тип операции
export type Operation = {
    id: number;
    userId: number;
    type: 'income' | 'expense';
    amount: number;
    category?: string;
    date: string;
    [key: string]: any;
};