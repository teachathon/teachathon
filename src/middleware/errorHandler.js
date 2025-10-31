/**
 * Centralized error handling middleware
 */

import { AppError } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
    // Log error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }

    // Handle known application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(err.details && { details: err.details })
        });
    }

    // Handle unknown errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res, next) {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.path} not found`
    });
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
