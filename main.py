from src.agent import Agent
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

with open("./test/conversations/dummy.txt", "r") as f:
    QUERY = f.read()

if __name__ == "__main__":
    agent = Agent(config=CONFIG)
    agent.send_message(QUERY)

    # Generate question
    response = agent.receive_response(
        output_template=SYSTEM_PROMPTS["mcq"]["template"], 
        system_prompt=SYSTEM_PROMPTS["mcq"]["prompt"], 
        auto_append=False)
    response_content = json.loads(response["content"])
    print(json.dumps(response_content, indent=4))