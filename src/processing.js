/**
 * Core processing functions for question generation
 */

import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { RoleEnum } from './enums/agent.js';

/**
 * Load JSON configuration file
 */
export async function loadConfig(configPath) {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Load system prompts from specification files
 */
export async function loadSystemPrompts(pathToSpecs) {
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
}

/**
 * Resolve API key from environment or config
 */
export function resolveApiKey(config) {
    const envKey = (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();
    const candidate = envKey;

    if (!candidate || candidate === '...') {
        throw new Error(
            'Missing API key. Set the OPENROUTER_API_KEY environment variable before running the script.'
        );
    }

    return candidate;
}

/**
 * Prompt user for integer input (for CLI usage)
 */
export async function promptForInt(promptText) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        const askQuestion = () => {
            rl.question(promptText, (answer) => {
                const parsed = parseInt(answer.trim(), 10);

                if (isNaN(parsed)) {
                    console.error('Please enter a whole number.');
                    askQuestion();
                } else if (parsed < 0) {
                    console.error('Number of questions cannot be negative.');
                    askQuestion();
                } else {
                    rl.close();
                    resolve(parsed);
                }
            });
        };

        askQuestion();
    });
}

/**
 * Generate quiz questions from conversation messages
 */
export async function generateQuestions(agent, messages, numMcq, numOpen, systemPrompts) {
    // Reset conversation
    agent.resetConversation();

    // Combine all message contents
    const query = messages.map(msg => msg.content).join('\n');
    agent.sendMessage(query);

    const questions = [];
    const answerBalance = { A: 0, B: 0, C: 0, D: 0 };

    // Generate MCQ questions one by one
    for (let i = 0; i < numMcq; i++) {
        let enhancedPrompt = systemPrompts.mcq.prompt;

        // Add previously generated questions to avoid duplicates
        if (questions.length > 0) {
            const covered = questions
                .filter(q => q.type === 'mcq')
                .map(q => `- ${q.question}`)
                .join('\n');
            enhancedPrompt += `\n\nAlready generated questions:\n${covered}`;
        }

        // Calculate weights for answer distribution
        const total = Object.values(answerBalance).reduce((a, b) => a + b, 0) + 1;
        const weights = ['A', 'B', 'C', 'D'].map(k => {
            // Weight = inverse of frequency + small noise
            return (total - answerBalance[k] + Math.random()) / total;
        });

        // Weighted random selection
        const chosenCorrect = weightedRandomChoice(['A', 'B', 'C', 'D'], weights);

        enhancedPrompt += `\n\nFor this next question, ensure the correct answer is option '${chosenCorrect}'.`;

        // Generate question
        const response = await agent.receiveResponse(
            systemPrompts.mcq.template,
            enhancedPrompt,
            false
        );

        const responseContent = JSON.parse(response.content);
        responseContent.correct_answer = chosenCorrect;
        answerBalance[chosenCorrect]++;
        questions.push(responseContent);
    }

    // Generate open-ended questions (all at once)
    if (numOpen > 0) {
        const openPrompt = systemPrompts.open_ended.prompt + 
            `\n\nGenerate exactly ${numOpen} open-ended questions.`;

        const openResponse = await agent.receiveResponse(
            systemPrompts.open_ended.template,
            openPrompt,
            false
        );

        const openContent = JSON.parse(openResponse.content);

        if (Array.isArray(openContent)) {
            questions.push(...openContent.slice(0, numOpen));
        } else {
            questions.push(openContent);
        }
    }

    return questions;
}

/**
 * Generate quiz title from questions
 */
export async function generateTitle(agent, questions, systemPrompts) {
    agent.resetConversation();

    const query = questions.map(q => JSON.stringify(q)).join('\n');
    agent.sendMessage(query);

    const response = await agent.receiveResponse(
        { title: '...' },
        systemPrompts.quiz_title,
        false
    );

    const content = JSON.parse(response.content);
    return content.title;
}

/**
 * Weighted random choice helper
 */
function weightedRandomChoice(choices, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < choices.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return choices[i];
        }
    }

    return choices[choices.length - 1];
}
