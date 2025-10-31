/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

// Message schema for conversation messages
const messageSchema = z.object({
    conv_id: z.number().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1, 'Message content cannot be empty')
});

// Request schema for quiz generation
export const quizRequestSchema = z.object({
    user_email: z.string().email('Invalid email address'),
    num_mcq: z.number().int().min(0).max(50, 'MCQ count must be between 0 and 50'),
    num_open: z.number().int().min(0).max(20, 'Open-ended question count must be between 0 and 20'),
    messages: z.array(messageSchema).min(1, 'At least one message is required')
}).refine(
    (data) => data.num_mcq + data.num_open > 0,
    'At least one question (MCQ or open-ended) must be requested'
);

// Config schema
export const configSchema = z.object({
    base_url: z.string().url().optional(),
    chat_model: z.string().min(1, 'Chat model must be specified'),
    email_sender_name: z.string().optional().default('MindfuLLM'),
    api_key: z.string().optional()
});

/**
 * Validate data against a schema
 */
export function validate(schema, data) {
    return schema.parse(data);
}

/**
 * Safe validation that returns result object
 */
export function safeValidate(schema, data) {
    return schema.safeParse(data);
}
