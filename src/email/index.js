import fs from 'fs/promises';
import { google } from 'googleapis';
import { Buffer } from 'buffer';
import readline from 'readline';

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];


export class GmailEmailSender {
    constructor(credentialsFile = 'credentials.json', tokenFile = 'token.gmail.json') {
        this.credentialsFile = credentialsFile;
        this.tokenFile = tokenFile;
        this.creds = null;
        this.service = null;
    }


    async initialize() {
        await this._authenticate();
    }

    async _authenticate() {
        try {
            // Check if we have saved credentials
            if (await this._fileExists(this.tokenFile)) {
                const tokenContent = await fs.readFile(this.tokenFile, 'utf-8');
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

            this.service = google.gmail({ version: 'v1', auth: this.creds });
        } catch (error) {
            throw new Error(`Gmail authentication failed: ${error.message}`);
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
            scope: GMAIL_SCOPES,
        });

        console.log('Authorize Gmail access by visiting this url:', authUrl);

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
                    await fs.writeFile(this.tokenFile, JSON.stringify(tokens));
                    console.log('Gmail token stored to', this.tokenFile);

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
     * Create a base64-encoded message payload for the Gmail API
     */
    _createMessage(recipient, subject, body, senderName = null) {
        const messageParts = [
            senderName ? `From: ${senderName}` : null,
            `To: ${recipient}`,
            `Subject: ${subject}`,
            '',
            body
        ].filter(part => part !== null);

        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        return { raw: encodedMessage };
    }

    /**
     * Send a plain-text email to the supplied recipient
     * 
     * @param {string} recipient - Email address of the recipient
     * @param {string} subject - Subject line for the email
     * @param {string} body - Plain-text body content
     * @param {string} senderName - Optional friendly name for the From header
     * @param {string} senderId - Gmail identifier of the authenticated user ("me" works)
     * @returns {string} The Gmail API message id for the sent email
     */
    async sendEmail(recipient, subject, body, senderName = null, senderId = 'me') {
        if (!this.service) {
            await this.initialize();
        }

        const payload = this._createMessage(recipient, subject, body, senderName);

        try {
            const response = await this.service.users.messages.send({
                userId: senderId,
                requestBody: payload
            });

            return response.data.id || '';
        } catch (error) {
            throw new Error(`Failed to send email via Gmail API: ${error.message}`);
        }
    }
}
