/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400);
        this.details = details;
    }
}

export class QuizGenerationError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500);
        this.originalError = originalError;
    }
}

export class EmailError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500);
        this.originalError = originalError;
    }
}

export class ConfigurationError extends AppError {
    constructor(message) {
        super(message, 500, false);
    }
}

export class APIError extends AppError {
    constructor(message, statusCode = 502) {
        super(message, statusCode);
    }
}
