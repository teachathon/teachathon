import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Agent } from './src/agent.js';
import { GoogleFormsGenerator } from './src/forms_generator.js';
import { GmailEmailSender } from './src/email/index.js';
import { buildEmailBody } from './src/email/utils.js';
import {
    loadConfig,
    loadSystemPrompts,
    resolveApiKey,
    generateQuestions,
    generateTitle
} from './src/processing.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['*'],
    allowedHeaders: ['*']
}));
app.use(express.json());

// Application state
let appState = {};

// Initialize application
async function initialize() {
    console.log('Server starting...');

    try {
        appState.config = await loadConfig('./configs/base.json');
        appState.systemPrompts = await loadSystemPrompts('./specs/base.json');
        
        appState.config.apiKey = resolveApiKey(appState.config);
        
        appState.agent = new Agent(appState.config);
        appState.formGenerator = new GoogleFormsGenerator('credentials.json');
        appState.emailSender = new GmailEmailSender('credentials.json');
        
        console.log('Server initialization complete.');
    } catch (error) {
        console.error('Initialization error:', error.message);
        process.exit(1);
    }
}

// Routes
app.post('/receive', async (req, res) => {
    try {
        console.log('Request received.');
        
        const { user_email, num_mcq, num_open, messages } = req.body;
        
        // Validate request
        if (!user_email || num_mcq === undefined || num_open === undefined || !messages) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate questions
        const questions = await generateQuestions(
            appState.agent,
            messages,
            num_mcq,
            num_open,
            appState.systemPrompts
        );
        
        // Generate quiz title
        const quizTitle = await generateTitle(
            appState.agent,
            questions,
            appState.systemPrompts
        );
        
        // Create Google Form
        const formUrl = await appState.formGenerator.createQuizFromJson(
            questions,
            quizTitle
        );
        
        console.log(`Quiz generated at URL: ${formUrl}`);
        
        // Send email
        const emailSubject = `MindfuLLM - ${quizTitle}`;
        const emailSenderName = appState.config.email_sender_name || 'MindfuLLM';
        const emailBody = buildEmailBody(formUrl);
        
        try {
            const messageId = await appState.emailSender.sendEmail(
                user_email,
                emailSubject,
                emailBody,
                emailSenderName
            );
            console.log(`Emailed form link to ${user_email}`);
        } catch (emailError) {
            console.error(`Unable to email form link: ${emailError.message}`);
        }
        
        res.json({ status: 'ok' });
        
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

async function start() {
    await initialize();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://127.0.0.1:${PORT}`);
        console.log(`API docs available at http://127.0.0.1:${PORT}/docs`);
    });
}

process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Server shutting down...');
    process.exit(0);
});

start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
