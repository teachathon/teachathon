import json
import os
import random
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

from src.agent import Agent
from src.email_sender import GmailEmailSender
from src.forms_generator import GoogleFormsGenerator

with open("./specs/base.json", "r") as j:
    SPEC_PATHS = json.loads(j.read())

SYSTEM_PROMPTS = {}
for qtype in ["mcq", "open_ended"]:
    SYSTEM_PROMPTS[qtype] = {}
    for spec in ["prompt", "template"]:
        file_path = Path(SPEC_PATHS[qtype][spec])
        file_extension = file_path.suffix.lower()
        with open(file_path, "r") as f:
            SYSTEM_PROMPTS[qtype][spec] = json.loads(f.read()) if file_extension == ".json" else f.read()

with open("./configs/base.json", "r") as j:
    CONFIG = json.loads(j.read())

with open("./test/conversations/dummy.txt", "r", encoding="utf-8") as f:
    QUERY = f.read()

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
        try:
            raw_value = input(prompt).strip()
        except EOFError:
            print("Input stream closed unexpectedly.", file=sys.stderr)
            sys.exit(1)
        except KeyboardInterrupt:
            print("\nInput cancelled by user.", file=sys.stderr)
            sys.exit(1)
        try:
            parsed = int(raw_value)
        except ValueError:
            print("Please enter a whole number.", file=sys.stderr)
            continue

        if parsed < 0:
            print("Number of questions cannot be negative.", file=sys.stderr)
            continue

        return parsed


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def prompt_for_email(prompt: str) -> str:
    """Prompt the user until a syntactically valid email address is provided."""
    while True:
        try:
            raw_value = input(prompt).strip()
        except EOFError:
            print("Input stream closed unexpectedly.", file=sys.stderr)
            sys.exit(1)
        except KeyboardInterrupt:
            print("\nInput cancelled by user.", file=sys.stderr)
            sys.exit(1)

        if not raw_value:
            print("Email address is required.", file=sys.stderr)
            continue

        if not EMAIL_PATTERN.match(raw_value):
            print("Please enter a valid email address (example: name@example.com).", file=sys.stderr)
            continue

        return raw_value


if __name__ == "__main__":
    load_dotenv()
    try:
        CONFIG["api_key"] = resolve_api_key(CONFIG)
    except RuntimeError as exc:
        sys.exit(str(exc))

    user_email = prompt_for_email("Enter your email address: ")
    CONFIG["user_email"] = user_email

    num_mcq = prompt_for_int("Enter number of MCQ questions to generate: ")
    num_open = prompt_for_int("Enter number of open-ended questions to generate: ")
    
    

    agent = Agent(config=CONFIG)
    agent.send_message(QUERY)

    questions = []
    answer_balance = {"A": 0, "B": 0, "C": 0, "D": 0}

    for i in range(num_mcq):
        enhanced_prompt = SYSTEM_PROMPTS["mcq"]["prompt"]

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
            output_template=SYSTEM_PROMPTS["mcq"]["template"],
            system_prompt=enhanced_prompt,
            auto_append=False
        )

        response_content = json.loads(response["content"])

        response_content["correct_answer"] = chosen_correct
        answer_balance[chosen_correct] += 1
        questions.append(response_content)

    # Generate open-ended questions only once (after MCQs)
    open_response = agent.receive_response(
        output_template=SYSTEM_PROMPTS["open_ended"]["template"],
        system_prompt=SYSTEM_PROMPTS["open_ended"]["prompt"] + f"\n\nGenerate exactly {num_open} open-ended questions.",
        auto_append=False
    )
    open_content = json.loads(open_response["content"])
    
    if isinstance(open_content, list):
        questions.extend(open_content[:num_open])
    else:
        questions.append(open_content)
    
    generator = GoogleFormsGenerator('credentials.json')
    form_url = generator.create_quiz_from_json(
        questions,
        form_title="MindfuLLM Generated Quiz"
    )
    
    with open("last_form_url.txt", "w") as f:
        f.write(form_url)
    
    print("Answer distribution:", answer_balance)
    print(form_url)

    email_subject = CONFIG.get("email_subject", "MindfuLLM Quiz")
    email_sender_name = CONFIG.get("email_sender_name")
    email_body = (
        "Hello!\n\n"
        "Your MindfuLLM quiz is ready:\n"
        f"{form_url}\n\n"
        "Recall and testing has been empirically shown to improve learning outcomes significantly. Enjoy your increased mastery!\n\n"
        "You can share this link with others, or open it to make further edits and tweaks.\n\n"
        "If you want to learn more about MindfuLLM, visit https://github.com/teachathon/teachathon.\n\n"
        "Best,\n"
        "MindfuLLM Team"
    )

    try:
        email_sender = GmailEmailSender("credentials.json", "token.gmail.pickle")
        message_id = email_sender.send_email(
            recipient=user_email,
            subject=email_subject,
            body=email_body,
            sender_name=email_sender_name,
        )
        print(f"Emailed form link to {user_email} (message id: {message_id})")
    except Exception as exc:
        print(f"Unable to email form link: {exc}", file=sys.stderr)
