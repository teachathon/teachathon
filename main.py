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
    generate_questions
) 

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

    form_url = app.state.form_generator.create_quiz_from_json(
        questions,
        form_title="Quiz"
    )

    print(f"Quiz generated at URL: {form_url}")

    return {"status": "ok"}