
export type Tokens = {
    accessToken: string;
    refreshToken: string;
}

export type User = {
    id: number;
    name: string;
    lastName: string;
    email: string;
}

export type LoginResponse = {
    error?: boolean;
    message?: string;
    tokens?: Tokens;
    user?: User;
}