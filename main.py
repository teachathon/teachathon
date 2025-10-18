from contextlib import asynccontextmanager
from dotenv import load_dotenv
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import ExtensionData
from src.agent import Agent
from src.forms_generator import GoogleFormsGenerator
from src.processing import (
    load_config, 
    load_system_prompts,
    resolve_api_key,
    generate_questions,
    generate_title
) 
from src.email import GmailEmailSender
from src.email.utils import build_email_body

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server started.")

    app.state.config = load_config("./configs/base.json")
    app.state.system_prompts = load_system_prompts("./specs/base.json")

    load_dotenv()
    try:
        app.state.config["api_key"] = resolve_api_key(app.state.config)
    except RuntimeError as exc:
        sys.exit(str(exc))

    app.state.agent = Agent(config=app.state.config)
    app.state.form_generator = GoogleFormsGenerator('credentials.json')
    app.state.email_sender = GmailEmailSender('credentials.json')

    yield

    print("Server shutting down.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/receive")
async def receive_from_extension(data: ExtensionData):
    print("Request received.")
    
    questions = generate_questions(
        agent=app.state.agent,
        messages=data.messages,
        num_mcq=data.num_mcq,
        num_open=data.num_open,
        system_propmts=app.state.system_prompts
    )

    quiz_title = generate_title(
        agent=app.state.agent,
        questions=questions,
        system_propmts=app.state.system_prompts
    )

    form_url = app.state.form_generator.create_quiz_from_json(
        questions,
        form_title=quiz_title
    )

    print(f"Quiz generated at URL: {form_url}")

    email_subject = f"MindfuLLM - {quiz_title}"
    email_sender_name = app.state.config.get("email_sender_name")
    email_body = build_email_body(form_url)

    try:
        message_id = app.state.email_sender.send_email(
            recipient=data.user_email,
            subject=email_subject,
            body=email_body,
            sender_name=email_sender_name
        )
        print(f"Emailed form link to {data.user_email} (message id: {message_id})")
    except Exception as exc:
         print(f"Unable to email form link: {exc}", file=sys.stderr)


    return {"status": "ok"}