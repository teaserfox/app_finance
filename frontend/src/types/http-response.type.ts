export interface HttpSuccess<T> {
    error?: false;
    data: T;
}

export interface HttpFailed {
    error: true;
    message: string;
}

export type HttpResponseType<T> = HttpSuccess<T> | HttpFailed;