import {Tokens} from "@/types/token-user-login.type";

export type StoredUserType = {
    fullName: string;
    userId: number;
    email: string;
};

export type StoredUserWithTokens = StoredUserType & {
    tokens: Tokens | null;
};