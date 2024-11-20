export interface AppError {
    statusCode: number;
    message: string;
};

export const appError = (statusCode: number, message: string): AppError => {
    return {
        statusCode,
        message
    }
};