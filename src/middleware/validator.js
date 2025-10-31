/**
 * Validation middleware
 */

import { ValidationError } from '../errors/index.js';

/**
 * Create validation middleware for request body
 */
export function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.query);
            req.query = validated;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Create validation middleware for route parameters
 */
export function validateParams(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.params);
            req.params = validated;
            next();
        } catch (error) {
            next(error);
        }
    };
}
