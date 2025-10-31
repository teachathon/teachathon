/**
 * Service for generating quiz questions
 */

import { QuizGenerationError } from '../errors/index.js';
import { RoleEnum } from '../enums/agent.js';

export class QuestionGeneratorService {
    constructor(agent, systemPrompts) {
        this.agent = agent;
        this.systemPrompts = systemPrompts;
    }

    /**
     * Generate quiz questions from conversation messages
     */
    async generateQuestions(messages, numMcq, numOpen) {
        try {
            // Reset conversation
            this.agent.resetConversation();

            // Combine all message contents
            const query = messages.map(msg => msg.content).join('\n');
            this.agent.sendMessage(query);

            const questions = [];
            const answerBalance = { A: 0, B: 0, C: 0, D: 0 };

            // Generate MCQ questions one by one
            for (let i = 0; i < numMcq; i++) {
                const mcqQuestion = await this._generateMcqQuestion(questions, answerBalance);
                questions.push(mcqQuestion);
            }

            // Generate open-ended questions (all at once)
            if (numOpen > 0) {
                const openQuestions = await this._generateOpenEndedQuestions(numOpen);
                questions.push(...openQuestions);
            }

            return questions;
        } catch (error) {
            throw new QuizGenerationError(
                `Failed to generate questions: ${error.message}`,
                error
            );
        }
    }

    /**
     * Generate a single MCQ question with answer balancing
     */
    async _generateMcqQuestion(existingQuestions, answerBalance) {
        let enhancedPrompt = this.systemPrompts.mcq.prompt;

        // Add previously generated questions to avoid duplicates
        if (existingQuestions.length > 0) {
            const covered = existingQuestions
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
        const chosenCorrect = this._weightedRandomChoice(['A', 'B', 'C', 'D'], weights);

        enhancedPrompt += `\n\nFor this next question, ensure the correct answer is option '${chosenCorrect}'.`;

        // Generate question
        const response = await this.agent.receiveResponse(
            this.systemPrompts.mcq.template,
            enhancedPrompt,
            false
        );

        const responseContent = JSON.parse(response.content);
        responseContent.correct_answer = chosenCorrect;
        answerBalance[chosenCorrect]++;

        return responseContent;
    }

    /**
     * Generate multiple open-ended questions
     */
    async _generateOpenEndedQuestions(numOpen) {
        const openPrompt = this.systemPrompts.open_ended.prompt +
            `\n\nGenerate exactly ${numOpen} open-ended questions.`;

        const openResponse = await this.agent.receiveResponse(
            this.systemPrompts.open_ended.template,
            openPrompt,
            false
        );

        const openContent = JSON.parse(openResponse.content);

        if (Array.isArray(openContent)) {
            return openContent.slice(0, numOpen);
        } else {
            return [openContent];
        }
    }

    /**
     * Generate quiz title from questions
     */
    async generateTitle(questions) {
        try {
            this.agent.resetConversation();

            const query = questions.map(q => JSON.stringify(q)).join('\n');
            this.agent.sendMessage(query);

            const response = await this.agent.receiveResponse(
                { title: '...' },
                this.systemPrompts.quiz_title,
                false
            );

            const content = JSON.parse(response.content);
            return content.title;
        } catch (error) {
            throw new QuizGenerationError(
                `Failed to generate quiz title: ${error.message}`,
                error
            );
        }
    }

    /**
     * Weighted random choice helper
     */
    _weightedRandomChoice(choices, weights) {
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
}
