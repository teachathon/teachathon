/**
 * MindfuLLM Server - Refactored with improved architecture
 * - Service layer pattern
 * - Dependency injection
 * - Centralized error handling
 * - Input validation
 * - Structured logging
 * - Security middleware
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// Import configurations
import { loadConfig, loadSystemPrompts, resolveApiKey } from './src/config/index.js';

// Import core classes
import { Agent } from './src/agent.js';
import { GoogleFormsGenerator } from './src/forms_generator.js';
import { GmailEmailSender } from './src/email/index.js';

// Import services
import { QuestionGeneratorService } from './src/services/QuestionGeneratorService.js';
import { EmailService } from './src/services/EmailService.js';
import { QuizService } from './src/services/QuizService.js';

// Import controllers
import { QuizController } from './src/controllers/QuizController.js';

// Import middleware
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { validateRequest } from './src/middleware/validator.js';
import { requestLogger, requestId } from './src/middleware/requestLogger.js';

// Import validators
import { quizRequestSchema } from './src/validators/index.js';

// Import logger
import { logger } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Application state
let services = {};

/**
 * Initialize application services
 */
async function initialize() {
    logger.info('Server initializing...');

    try {
        // Ensure logs directory exists
        await fs.mkdir('logs', { recursive: true });

        // Load configuration
        const config = await loadConfig('./configs/base.json');
        const systemPrompts = await loadSystemPrompts('./specs/base.json');

        // Resolve API key
        config.apiKey = resolveApiKey(config);

        // Initialize core components
        const agent = new Agent(config);
        const formGenerator = new GoogleFormsGenerator('credentials.json');
        const emailSender = new GmailEmailSender('credentials.json');

        // Initialize services with dependency injection
        const questionGenerator = new QuestionGeneratorService(agent, systemPrompts);
        const emailService = new EmailService(emailSender, config);
        const quizService = new QuizService(
            questionGenerator,
            formGenerator,
            emailService,
            config
        );

        // Initialize controller
        const quizController = new QuizController(quizService);

        // Store services
        services = {
            config,
            systemPrompts,
            agent,
            formGenerator,
            emailSender,
            questionGenerator,
            emailService,
            quizService,
            quizController
        };

        logger.info('Server initialization complete');
    } catch (error) {
        logger.error('Initialization failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Configure middleware
 */
function configureMiddleware() {
    // Security middleware
    app.use(helmet());

    // CORS
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.RATE_LIMIT || 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use('/receive', limiter);

    // Body parser
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and logging
    app.use(requestId);
    app.use(requestLogger);
}

/**
 * Configure routes
 */
function configureRoutes() {
    const { quizController } = services;

    // Health check
    app.get('/health', quizController.healthCheck);

    // Main quiz generation endpoint
    app.post(
        '/receive',
        validateRequest(quizRequestSchema),
        quizController.generateQuiz
    );

    // API info
    app.get('/', (req, res) => {
        res.json({
            name: 'MindfuLLM API',
            version: '1.0.0',
            endpoints: {
                health: 'GET /health',
                generateQuiz: 'POST /receive'
            }
        });
    });

    // 404 handler
    app.use(notFoundHandler);

    // Error handler (must be last)
    app.use(errorHandler);
}

/**
 * Start the server
 */
async function start() {
    try {
        await initialize();
        configureMiddleware();
        configureRoutes();

        app.listen(PORT, () => {
            logger.info(`Server running on http://127.0.0.1:${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown() {
    const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down gracefully...`);
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
            reason,
            promise
        });
    });
}

// Setup and start
setupGracefulShutdown();
start();

export { app, services };
