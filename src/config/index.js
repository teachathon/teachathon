/**
 * Configuration management with validation
 */

import fs from 'fs/promises';
import path from 'path';
import { configSchema } from '../validators/index.js';
import { ConfigurationError } from '../errors/index.js';

/**
 * Load and validate configuration
 */
export async function loadConfig(configPath) {
    try {
        const content = await fs.readFile(configPath, 'utf-8');
        const rawConfig = JSON.parse(content);

        // Validate config
        const config = configSchema.parse(rawConfig);
        return config;
    } catch (error) {
        if (error.name === 'ZodError') {
            throw new ConfigurationError(
                `Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`
            );
        }
        throw new ConfigurationError(`Failed to load config from ${configPath}: ${error.message}`);
    }
}

/**
 * Load system prompts from specification files
 */
export async function loadSystemPrompts(pathToSpecs) {
    try {
        const content = await fs.readFile(pathToSpecs, 'utf-8');
        const specPaths = JSON.parse(content);

        const systemPrompts = {};

        // Load MCQ and open-ended prompts/templates
        for (const qtype of ['mcq', 'open_ended']) {
            systemPrompts[qtype] = {};

            for (const spec of ['prompt', 'template']) {
                const filePath = specPaths[qtype][spec];
                const fileExtension = path.extname(filePath).toLowerCase();
                const fileContent = await fs.readFile(filePath, 'utf-8');

                systemPrompts[qtype][spec] = fileExtension === '.json' ?
                    JSON.parse(fileContent) : fileContent;
            }
        }

        // Load quiz title prompt
        const quizTitleContent = await fs.readFile(specPaths.quiz_title, 'utf-8');
        systemPrompts.quiz_title = quizTitleContent;

        return systemPrompts;
    } catch (error) {
        throw new ConfigurationError(`Failed to load system prompts: ${error.message}`);
    }
}

/**
 * Resolve API key from environment or config
 */
export function resolveApiKey(config) {
    const envKey = (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();
    const candidate = envKey || config.api_key;

    if (!candidate || candidate === '...') {
        throw new ConfigurationError(
            'Missing API key. Set the OPENROUTER_API_KEY or OPENAI_API_KEY environment variable.'
        );
    }

    return candidate;
}
