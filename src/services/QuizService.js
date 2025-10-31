/**
 * Main quiz service orchestrating question generation, form creation, and email
 */

import { QuizGenerationError } from '../errors/index.js';
import { logger } from '../utils/logger.js';

export class QuizService {
    constructor(questionGenerator, formGenerator, emailService, config) {
        this.questionGenerator = questionGenerator;
        this.formGenerator = formGenerator;
        this.emailService = emailService;
        this.config = config;
    }

    /**
     * Generate a complete quiz and send it via email
     */
    async createAndSendQuiz(data) {
        const { messages, num_mcq, num_open, user_email } = data;

        try {
            logger.info('Starting quiz generation', {
                num_mcq,
                num_open,
                user_email,
                message_count: messages.length
            });

            // Step 1: Generate questions
            const questions = await this.questionGenerator.generateQuestions(
                messages,
                num_mcq,
                num_open
            );

            logger.info('Questions generated successfully', {
                total_questions: questions.length
            });

            // Step 2: Generate quiz title
            const quizTitle = await this.questionGenerator.generateTitle(questions);

            logger.info('Quiz title generated', { title: quizTitle });

            // Step 3: Create Google Form
            const formUrl = await this.formGenerator.createQuizFromJson(
                questions,
                quizTitle
            );

            logger.info('Google Form created', { formUrl });

            // Step 4: Send email (non-blocking, log errors but don't fail the request)
            let emailSent = false;
            let emailError = null;

            try {
                await this.emailService.sendQuizEmail(user_email, quizTitle, formUrl);
                emailSent = true;
                logger.info('Email sent successfully', { user_email });
            } catch (error) {
                emailError = error.message;
                logger.error('Failed to send email', {
                    user_email,
                    error: error.message
                });
            }

            return {
                formUrl,
                quizTitle,
                questionsGenerated: questions.length,
                emailSent,
                emailError
            };
        } catch (error) {
            logger.error('Quiz generation failed', {
                error: error.message,
                stack: error.stack
            });

            if (error instanceof QuizGenerationError) {
                throw error;
            }

            throw new QuizGenerationError(
                `Failed to create quiz: ${error.message}`,
                error
            );
        }
    }
}
