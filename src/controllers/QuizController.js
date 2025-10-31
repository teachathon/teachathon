/**
 * Quiz controller handling HTTP requests
 */

import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export class QuizController {
    constructor(quizService) {
        this.quizService = quizService;
    }

    /**
     * Handle quiz generation request
     */
    generateQuiz = asyncHandler(async (req, res) => {
        const requestData = req.body;

        logger.info('Quiz generation request received', {
            requestId: req.id,
            userEmail: requestData.user_email
        });

        const result = await this.quizService.createAndSendQuiz(requestData);

        res.json({
            status: 'success',
            data: {
                formUrl: result.formUrl,
                quizTitle: result.quizTitle,
                questionsGenerated: result.questionsGenerated,
                emailSent: result.emailSent,
                ...(result.emailError && { emailError: result.emailError })
            }
        });
    });

    /**
     * Health check endpoint
     */
    healthCheck = asyncHandler(async (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
}
