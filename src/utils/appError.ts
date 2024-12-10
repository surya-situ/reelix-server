export interface AppError {
    statusCode: number;
    message: string;
    details?: any;
};

export const appError = (statusCode: number, message: string, details?: any): AppError => {
    return {
        statusCode,
        message,
        details
    }
};