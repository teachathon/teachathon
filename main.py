from src.agent import Agent
from src.forms_generator import GoogleFormsGenerator
import json
from pathlib import Path

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

if __name__ == "__main__":
    num_mcq = int(input("Enter number of MCQ questions to generate: "))
    num_open = int(input("Enter number of open-ended questions to generate: "))

    agent = Agent(config=CONFIG)
    agent.send_message(QUERY)

    questions = []
    
    for i in range(num_mcq):
        response = agent.receive_response(
            output_template=SYSTEM_PROMPTS["mcq"]["template"], 
            system_prompt=SYSTEM_PROMPTS["mcq"]["prompt"], 
            auto_append=False
        )
        response_content = json.loads(response["content"])
        questions.append(response_content)
    
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
        form_title="Quiz"
    )
    
    with open("last_form_url.txt", "w") as f:
        f.write(form_url)
    
    print(form_url)
