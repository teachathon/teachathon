/**
 * Google Forms Generator for Question Export
 * Automatically creates Google Forms from generated MCQ and open-ended questions
 */

import fs from 'fs/promises';
import { google } from 'googleapis';
import path from 'path';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/forms.body'];

export class GoogleFormsGenerator {
    constructor(credentialsFile = 'credentials.json') {
        this.credentialsFile = credentialsFile;
        this.creds = null;
        this.service = null;
        this.tokenPath = 'token.json';
    }

    /**
     * Initialize and authenticate with Google
     */
    async initialize() {
        await this._authenticate();
    }

    /**
     * Handle OAuth2 authentication with Google
     */
    async _authenticate() {
        try {
            // Check if we have saved credentials
            if (await this._fileExists(this.tokenPath)) {
                const tokenContent = await fs.readFile(this.tokenPath, 'utf-8');
                const token = JSON.parse(tokenContent);
                
                const credContent = await fs.readFile(this.credentialsFile, 'utf-8');
                const credentials = JSON.parse(credContent);
                const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

                const oAuth2Client = new google.auth.OAuth2(
                    client_id,
                    client_secret,
                    redirect_uris[0]
                );

                oAuth2Client.setCredentials(token);
                this.creds = oAuth2Client;
            } else {
                // Need to get new token
                this.creds = await this._getNewToken();
            }

            this.service = google.forms({ version: 'v1', auth: this.creds });
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Get new token through OAuth2 flow
     */
    async _getNewToken() {
        const credContent = await fs.readFile(this.credentialsFile, 'utf-8');
        const credentials = JSON.parse(credContent);
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve, reject) => {
            rl.question('Enter the code from that page here: ', async (code) => {
                rl.close();
                try {
                    const { tokens } = await oAuth2Client.getToken(code);
                    oAuth2Client.setCredentials(tokens);

                    // Save token for future use
                    await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
                    console.log('Token stored to', this.tokenPath);

                    resolve(oAuth2Client);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Check if file exists
     */
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a new Google Form
     */
    async createForm(title, description = 'Quiz') {
        if (!this.service) {
            await this.initialize();
        }

        try {
            const form = {
                info: {
                    title: title,
                    documentTitle: title,
                }
            };

            const result = await this.service.forms.create({
                requestBody: form
            });

            const formId = result.data.formId;

            // Enable quiz mode and add description
            const updates = [];

            updates.push({
                updateSettings: {
                    settings: {
                        quizSettings: {
                            isQuiz: true
                        }
                    },
                    updateMask: 'quizSettings.isQuiz'
                }
            });

            if (description) {
                updates.push({
                    updateFormInfo: {
                        info: {
                            description: description
                        },
                        updateMask: 'description'
                    }
                });
            }

            if (updates.length > 0) {
                await this.service.forms.batchUpdate({
                    formId: formId,
                    requestBody: { requests: updates }
                });
            }

            return { formId, responderUri: result.data.responderUri };
        } catch (error) {
            throw new Error(`An error occurred: ${error.message}`);
        }
    }

    /**
     * Add an MCQ question to the form
     */
    async addMcqQuestion(formId, questionData, questionIndex) {
        try {
            const options = [];
            let correctAnswerValue = null;

            // Build options array
            for (const [key, value] of Object.entries(questionData.options)) {
                const optionValue = `${key}. ${value}`;
                options.push({ value: optionValue });

                if (key === questionData.correct_answer) {
                    correctAnswerValue = optionValue;
                }
            }

            const questionItem = {
                title: questionData.question,
                questionItem: {
                    question: {
                        required: true,
                        grading: {
                            pointValue: 1,
                            correctAnswers: {
                                answers: [{ value: correctAnswerValue }]
                            },
                            whenRight: {
                                text: questionData.explanation || 'Correct!'
                            },
                            whenWrong: {
                                text: questionData.explanation || ''
                            }
                        },
                        choiceQuestion: {
                            type: 'RADIO',
                            options: options
                        }
                    }
                }
            };

            const request = {
                requests: [{
                    createItem: {
                        item: questionItem,
                        location: {
                            index: questionIndex
                        }
                    }
                }]
            };

            await this.service.forms.batchUpdate({
                formId: formId,
                requestBody: request
            });

        } catch (error) {
            throw new Error(`Error adding MCQ question: ${error.message}`);
        }
    }

    /**
     * Add an open-ended question to the form
     */
    async addOpenEndedQuestion(formId, questionData, questionIndex) {
        try {
            const questionItem = {
                title: questionData.question,
                questionItem: {
                    question: {
                        required: true,
                        grading: {
                            pointValue: 0,
                            generalFeedback: {
                                text: `Sample Answer:\n\n${questionData.answer || 'No sample answer provided.'}`
                            }
                        },
                        textQuestion: {
                            paragraph: true
                        }
                    }
                }
            };

            const request = {
                requests: [{
                    createItem: {
                        item: questionItem,
                        location: {
                            index: questionIndex
                        }
                    }
                }]
            };

            await this.service.forms.batchUpdate({
                formId: formId,
                requestBody: request
            });

        } catch (error) {
            throw new Error(`Error adding open-ended question: ${error.message}`);
        }
    }

    /**
     * Create a complete form from question data
     */
    async createQuizFromJson(questionsData, formTitle = 'Generated Quiz') {
        if (!this.service) {
            await this.initialize();
        }

        const questions = Array.isArray(questionsData) ? questionsData : [questionsData];

        const date = new Date();
        const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        
        const { formId, responderUri } = await this.createForm(
            formTitle,
            `This quiz contains ${questions.length} question(s).\nGenerated by MindfuLLM at ${dateString}`
        );

        if (!formId) {
            throw new Error('Failed to create form');
        }

        // Add questions
        for (let idx = 0; idx < questions.length; idx++) {
            const question = questions[idx];
            
            if (question.type === 'mcq') {
                await this.addMcqQuestion(formId, question, idx);
            } else if (question.type === 'open_ended' || question.type === 'open-ended') {
                await this.addOpenEndedQuestion(formId, question, idx);
            }
        }

        return responderUri;
    }
}
