"""
Google Forms Generator for Question Export
Automatically creates Google Forms from generated MCQ and open-ended questions
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pickle
import os
import json

SCOPES = ['https://www.googleapis.com/auth/forms.body']

class GoogleFormsGenerator:
    def __init__(self, credentials_file='credentials.json'):
        """
        Initialize the Google Forms generator
        
        Args:
            credentials_file: Path to OAuth2 credentials JSON file
        """
        self.credentials_file = credentials_file
        self.creds = None
        self.service = None
        self._authenticate()
    
    def _authenticate(self):
        """Handle OAuth2 authentication with Google"""
        # Check if we have saved credentials
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                self.creds = pickle.load(token)
        
        # If no valid credentials, let user log in
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                self.creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open('token.pickle', 'wb') as token:
                pickle.dump(self.creds, token)
        
        self.service = build('forms', 'v1', credentials=self.creds)
    
    def create_form(self, title, description="Auto-generated quiz"):
        """
        Create a new Google Form
        
        Args:
            title: Form title
            description: Form description
            
        Returns:
            Form ID and URL
        """
        try:
            form = {
                "info": {
                    "title": title,
                    "documentTitle": title,
                }
            }
            
            result = self.service.forms().create(body=form).execute()
            form_id = result['formId']
            
            updates = []
            
            updates.append({
                "updateSettings": {
                    "settings": {
                        "quizSettings": {
                            "isQuiz": True
                        }
                    },
                    "updateMask": "quizSettings.isQuiz"
                }
            })
            
            if description:
                updates.append({
                    "updateFormInfo": {
                        "info": {
                            "description": description
                        },
                        "updateMask": "description"
                    }
                })
            
            if updates:
                update_body = {"requests": updates}
                self.service.forms().batchUpdate(
                    formId=form_id, body=update_body).execute()
            
            return form_id, result['responderUri']
        
        except HttpError as error:
            raise Exception(f'An error occurred: {error}')
    
    def add_mcq_question(self, form_id, question_data, question_index):
        """
        Add an MCQ question to the form
        
        Args:
            form_id: Google Form ID
            question_data: Dictionary containing question details
            question_index: Position in the form
        """
        try:
            options = []
            correct_answer_value = None
            
            for idx, (key, value) in enumerate(question_data['options'].items()):
                option_value = f"{key}. {value}"
                options.append({"value": option_value})
                
                # Store correct answer value
                if key == question_data['correct_answer']:
                    correct_answer_value = option_value
            
            question_item = {
                "title": question_data['question'],
                "questionItem": {
                    "question": {
                        "required": True,
                        "grading": {
                            "pointValue": 1,
                            "correctAnswers": {
                                "answers": [{"value": correct_answer_value}]
                            },
                            "whenRight": {
                                "text": question_data.get('explanation', 'Correct!')
                            },
                            "whenWrong": {
                                "text": question_data.get('explanation', '')
                            }
                        },
                        "choiceQuestion": {
                            "type": "RADIO",
                            "options": options
                        }
                    }
                }
            }
            
            request = {
                "requests": [{
                    "createItem": {
                        "item": question_item,
                        "location": {
                            "index": question_index
                        }
                    }
                }]
            }
            
            self.service.forms().batchUpdate(
                formId=form_id, body=request).execute()
            
        except HttpError as error:
            raise Exception(f'Error adding MCQ question: {error}')
    
    def add_open_ended_question(self, form_id, question_data, question_index):
        """
        Add an open-ended question to the form
        
        Args:
            form_id: Google Form ID
            question_data: Dictionary containing question details
            question_index: Position in the form
        """
        try:
            question_item = {
                "title": question_data['question'],
                "questionItem": {
                    "question": {
                        "required": True,
                        "grading": {
                            "pointValue": 0,
                            "generalFeedback": {
                                "text": f"Sample Answer:\n\n{question_data.get('answer', 'No sample answer provided.')}"
                            }
                        },
                        "textQuestion": {
                            "paragraph": True
                        }
                    }
                }
            }
            
            request = {
                "requests": [{
                    "createItem": {
                        "item": question_item,
                        "location": {
                            "index": question_index
                        }
                    }
                }]
            }
            
            self.service.forms().batchUpdate(
                formId=form_id, body=request).execute()
            
        except HttpError as error:
            raise Exception(f'Error adding open-ended question: {error}')
    
    def create_quiz_from_json(self, questions_data, form_title="Generated Quiz"):
        """
        Create a complete form from question data
        
        Args:
            questions_data: Can be a single question dict or list of questions
            form_title: Title for the form
            
        Returns:
            Form URL
        """
        if isinstance(questions_data, dict):
            questions = [questions_data]
        else:
            questions = questions_data
        
        form_id, form_url = self.create_form(
            title=form_title,
            description=f"This quiz contains {len(questions)} question(s)."
        )
        
        if not form_id:
            raise Exception("Failed to create form")
        
        for idx, question in enumerate(questions):
            if question['type'] == 'mcq':
                self.add_mcq_question(form_id, question, idx)
            elif question['type'] in ['open_ended', 'open-ended']:
                self.add_open_ended_question(form_id, question, idx)
        
        return form_url