export type OperationBodyType = {
    type: 'income' | 'expense';
    category_id: number;
    amount: number;
    date: string;
    comment: string;
}