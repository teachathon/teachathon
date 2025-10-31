/**
 * Agent system for managing LLM conversations
 */

import OpenAI from 'openai';
import { RoleEnum } from './enums/agent.js';

/**
 * Create a message object
 */
function createMessage(role, content) {
    return {
        role,
        content
    };
}

/**
 * Conversation class to manage message history
 */
export class Conversation {
    constructor() {
        this.messages = [];
    }

    insert(index, role, content) {
        const message = createMessage(role, content);
        this.messages.splice(index, 0, message);
        return message;
    }

    prepend(role, content) {
        return this.insert(0, role, content);
    }

    append(role, content) {
        return this.insert(this.messages.length, role, content);
    }

    pop(index = -1) {
        if (index === -1) {
            return this.messages.pop();
        }
        const actualIndex = index < 0 ? this.messages.length + index : index;
        return this.messages.splice(actualIndex, 1)[0];
    }

    setSystem(content) {
        const systemMessage = createMessage(RoleEnum.SYSTEM, content);
        this.messages = [
            systemMessage,
            ...this.messages.filter(m => m.role !== RoleEnum.SYSTEM)
        ];
        return systemMessage;
    }

    shortenTo(lastN) {
        if (this.messages.length > 0) {
            const systemMessage = this.messages[0].role === RoleEnum.SYSTEM ? 
                [this.messages[0]] : [];
            const recentMessages = this.messages.slice(-(Math.max(lastN - 1, 0)));
            this.messages = [...systemMessage, ...recentMessages];
        }
        return this;
    }

    get length() {
        return this.messages.length;
    }

    slice(start, end) {
        const conv = new Conversation();
        conv.messages = this.messages.slice(start, end);
        return conv;
    }

    getItem(index) {
        return this.messages[index];
    }

    setItem(index, value) {
        this.messages[index] = value;
    }

    *[Symbol.iterator]() {
        for (const message of this.messages) {
            yield message;
        }
    }

    toString() {
        return this.messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
    }
}

/**
 * Agent class for LLM interaction
 */
export class Agent {
    static config = {};

    constructor(config, defaultSystemPrompt = '', generationAttempts = 5) {
        const apiConfig = {
            apiKey: config.api_key || config.apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'http://localhost:8000',
                'X-Title': 'MindfuLLM'
            }
        };
        
        // Only set baseURL if it's provided and not empty
        if (config.base_url) {
            apiConfig.baseURL = config.base_url;
        }
        
        this.ai = new OpenAI(apiConfig);

        this.chatModel = config.chat_model;
        this.generationAttempts = generationAttempts;
        this.conversation = new Conversation();

        Agent.config = {
            ...Agent.config,
            [RoleEnum.SYSTEM]: defaultSystemPrompt
        };

        this.conversation.setSystem(defaultSystemPrompt);
    }

    resetConversation() {
        this.conversation = new Conversation();
    }

    sendMessage(content) {
        return this.conversation.append(RoleEnum.USER, content);
    }

    async receiveResponse(outputTemplate, systemPrompt = '', autoAppend = true) {
        this.conversation.setSystem(systemPrompt);

        let retries = this.generationAttempts;
        let content = '';

        while (!this.validResponse(content, outputTemplate) && retries > 0) {
            retries--;
            
            try {
                const response = await this.ai.chat.completions.create({
                    messages: this.conversation.messages,
                    model: this.chatModel
                });

                const messageContent = response.choices[0].message.content;
                content = this.postprocess(messageContent);
            } catch (error) {
                console.error('API call error:', error.message);
                if (retries === 0) throw error;
            }
        }

        if (retries === 0 && !this.validResponse(content, outputTemplate)) {
            throw new Error(
                `Response generation failed after ${this.generationAttempts} attempts.`
            );
        }

        const message = createMessage(RoleEnum.ASSISTANT, content);

        if (autoAppend) {
            this.conversation.append(message.role, message.content);
        }

        return message;
    }

    postprocess(content) {
        // Remove code block markers that LLM might add
        return content
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '')
            .trim();
    }

    _validResponse(content, outputTemplate) {
        if (!content || content === '') {
            return false;
        }

        try {
            let response;
            
            if (typeof content === 'string') {
                response = JSON.parse(content);
            } else if (typeof content === 'object') {
                response = content;
            } else {
                console.log('Wrong content type.');
                return false;
            }

            const responseKeys = new Set(Object.keys(response));
            const templateKeys = new Set(Object.keys(outputTemplate));

            // Check if keys match
            if (responseKeys.size !== templateKeys.size) {
                console.log('Keys do not match.');
                console.log('Response keys:', Array.from(responseKeys));
                console.log('Template keys:', Array.from(templateKeys));
                return false;
            }

            for (const key of templateKeys) {
                if (!responseKeys.has(key)) {
                    console.log('Keys do not match.');
                    return false;
                }
            }

            // Check types
            for (const [key, value] of Object.entries(response)) {
                const templateValue = outputTemplate[key];
                
                if (typeof value !== typeof templateValue) {
                    console.log('Type mismatch.');
                    console.log(`Key: ${key}, Value type: ${typeof value}, Template type: ${typeof templateValue}`);
                    return false;
                }

                // Recursively validate nested objects
                if (typeof templateValue === 'object' && templateValue !== null && !Array.isArray(templateValue)) {
                    if (!this._validResponse(value, templateValue)) {
                        console.log('Value dict invalid.');
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Validation error:', error.message);
            return false;
        }
    }

    validResponse(content, outputTemplate) {
        try {
            const loadedContent = typeof content === 'string' ? 
                JSON.parse(content) : content;

            if (typeof loadedContent === 'object' && !Array.isArray(loadedContent)) {
                return this._validResponse(content, outputTemplate);
            } else if (Array.isArray(loadedContent)) {
                const validations = loadedContent.map(question => 
                    this._validResponse(question, outputTemplate)
                );
                return !validations.includes(false);
            }
            
            return false;
        } catch (error) {
            console.error('Validation parsing error:', error.message);
            return false;
        }
    }
}
