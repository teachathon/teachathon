## Environment Setup

Run `pip install -r requirements.txt` in your desired environment.

## Generating Questions

Remember to change the paths to the system prompts and templates specified in `specs/base.json`.

Run `main.py` for an example.

The general pattern for generating one or more questions:
```python 
    agent = Agent(config=CONFIG)
    agent.send_message(QUERY)

    # Generate question
    response = agent.receive_response(
        output_template=SYSTEM_PROMPTS["mcq" | "open_ended"]["template"], 
        system_prompt=SYSTEM_PROMPTS["mcq" | "open_ended"]["prompt"], 
        auto_append=False)
    response_content = json.loads(response["content"])
    print(json.dumps(response_content, indent=4))
```