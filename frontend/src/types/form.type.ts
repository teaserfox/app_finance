export interface FormType {
    name: string;
    id: string;
    regex?: RegExp;
    valid: boolean;
    element?: HTMLInputElement | null;
}