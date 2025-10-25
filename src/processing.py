from src.agent import Agent
from src.forms_generator import GoogleFormsGenerator
from dotenv import load_dotenv
import json
import os
import sys
from pathlib import Path
import random


def load_config(config_path: str | Path) -> dict:
    with open(config_path, "r") as j:
        config = json.loads(j.read())
    return config

def load_system_prompts(path_to_specs: str | Path) -> dict:
    with open(path_to_specs, "r") as j:
        spec_paths = json.loads(j.read())

    system_prompts = {}
    for qtype in ["mcq", "open_ended"]:
        system_prompts[qtype] = {}
        for spec in ["prompt", "template"]:
            file_path = Path(spec_paths[qtype][spec])
            file_extension = file_path.suffix.lower()
            with open(file_path, "r") as f:
                system_prompts[qtype][spec] = json.loads(f.read()) if file_extension == ".json" else f.read()
    with open(spec_paths["quiz_title"], "r") as f:
        system_prompts["quiz_title"] = f.read()
    
    return system_prompts    

def resolve_api_key(config: dict) -> str:
    env_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    candidate = env_key
    if not candidate or candidate == "...":
        raise RuntimeError(
            "Missing API key. Set the OPENROUTER_API_KEY environment variable before running the script."
        )
    return candidate

def prompt_for_int(prompt: str) -> int:
    """Prompt the user until a non-negative integer is provided."""
    while True:
        raw_value = input(prompt).strip()
        try:
            parsed = int(raw_value)
        except ValueError:
            print("Please enter a whole number.", file=sys.stderr)
            continue

        if parsed < 0:
            print("Number of questions cannot be negative.", file=sys.stderr)
            continue

        return parsed


def generate_questions(agent: Agent, messages: list[dict], 
                       num_mcq: int, num_open: int, 
                       system_propmts: dict) -> list[dict]:
    
    # We always start from a blank conversation
    agent.reset_conversation()

    query = "\n".join([message.content for message in messages])
    agent.send_message(query)

    questions = []
    answer_balance = {"A": 0, "B": 0, "C": 0, "D": 0}

    for i in range(num_mcq):
        enhanced_prompt = system_propmts["mcq"]["prompt"]

        if questions:
            covered = "\n".join([f"- {q['question']}" for q in questions if q['type'] == 'mcq'])
            enhanced_prompt += f"\n\nAlready generated questions:\n{covered}"
        
        total = sum(answer_balance.values()) + 1  
        weights = []
        for k in ["A", "B", "C", "D"]:
        # Weight = inverse of frequency + small noise
            weight = (total - answer_balance[k] + random.random()) / total
            weights.append(weight)
        chosen_correct = random.choices(["A", "B", "C", "D"], weights=weights, k=1)[0]


        enhanced_prompt += f"\n\nFor this next question, ensure the correct answer is option '{chosen_correct}'."

        response = agent.receive_response(
            output_template=system_propmts["mcq"]["template"],
            system_prompt=enhanced_prompt,
            auto_append=False
        )

        response_content = json.loads(response["content"])

        response_content["correct_answer"] = chosen_correct
        answer_balance[chosen_correct] += 1
        questions.append(response_content)

    # Generate open-ended questions only once (after MCQs)
    open_response = agent.receive_response(
        output_template=system_propmts["open_ended"]["template"],
        system_prompt=system_propmts["open_ended"]["prompt"] + f"\n\nGenerate exactly {num_open} open-ended questions.",
        auto_append=False
    )
    open_content = json.loads(open_response["content"])
    
    if isinstance(open_content, list):
        questions.extend(open_content[:num_open])
    else:
        questions.append(open_content)

    return questions

def generate_title(agent: Agent, questions: list[dict], system_propmts: dict) -> str:
    agent.reset_conversation()

    query = "\n".join([str(question) for question in questions])
    agent.send_message(query)

    response = agent.receive_response(
        output_template={"title": "..."},
        system_prompt=system_propmts["quiz_title"],
        auto_append=False
    )
    content = json.loads(response["content"])
    title = content["title"]
    return title