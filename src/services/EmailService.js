/**
 * Service for email operations
 */

import { EmailError } from '../errors/index.js';
import { buildEmailBody } from '../email/utils.js';

export class EmailService {
    constructor(emailSender, config) {
        this.emailSender = emailSender;
        this.config = config;
    }

    /**
     * Send quiz email to user
     */
    async sendQuizEmail(recipientEmail, quizTitle, formUrl) {
        try {
            const subject = `MindfuLLM - ${quizTitle}`;
            const senderName = this.config.email_sender_name || 'MindfuLLM';
            const body = buildEmailBody(formUrl);

            const messageId = await this.emailSender.sendEmail(
                recipientEmail,
                subject,
                body,
                senderName
            );

            return { messageId, sent: true };
        } catch (error) {
            throw new EmailError(
                `Failed to send email to ${recipientEmail}: ${error.message}`,
                error
            );
        }
    }
}
