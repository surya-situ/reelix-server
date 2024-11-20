import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

export const globalError = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error...'

    res.status(statusCode).json(
        {
            status: 'Failed',
            success: false,
            message: message
        }
    )
};