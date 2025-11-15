export type Operation = {
    id: number;
    userId: number;
    type: 'income' | 'expense';
    amount: number;
    comment?: string;
    category?: string;
    date: string;
    __parsedDate?: Date; // для фронта
    category_id?: number;
    error?: boolean;
    message?: string;
};