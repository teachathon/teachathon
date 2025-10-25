
import {z} from 'zod';

export const MessageSchema = z.object({
    conv_id: z.number(),
    role: z.string(),
    content: z.string()
});

export const ExtensionDataSchema = z.object({
    user_email: z.string().email(),
    num_mcq: z.number().int().nonnegative(),
    num_open: z.number().int().nonnegative(),
    messages: z.array(MessageSchema)
});

// Type exports for TypeScript
export class Message {
    constructor(conv_id, role, content) {
        this.conv_id = conv_id;
        this.role = role;
        this.content = content;
    }
}

export class ExtensionData {
    constructor(user_email, num_mcq, num_open, messages) {
        this.user_email = user_email;
        this.num_mcq = num_mcq;
        this.num_open = num_open;
        this.messages = messages;
    }
}
