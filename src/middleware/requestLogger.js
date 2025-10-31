/**
 * Request logging middleware
 */

import morgan from 'morgan';
import { logger } from '../utils/logger.js';

// Create custom token for request ID
morgan.token('id', (req) => req.id);

// Custom format with request ID
const format = ':id :method :url :status :response-time ms - :res[content-length]';

// Create Morgan middleware
export const requestLogger = morgan(format, {
    stream: logger.stream,
    skip: (req, res) => {
        // Skip health check logs in production
        return process.env.NODE_ENV === 'production' && req.path === '/health';
    }
});

// Request ID middleware
export function requestId(req, res, next) {
    req.id = generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
}

function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
