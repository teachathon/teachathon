/**
 * Structured logging utility using Winston
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
});

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        }),
        // File transport for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    // Handle unhandled rejections
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
});

// Create a stream for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};
