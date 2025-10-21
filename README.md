# MindfuLLM: LLM Comprehension Quiz Generation

## To view our report on this project, click here: <a href="https://docs.google.com/document/d/1j4v1ITYjrSelpK56IqW31xNUDVgVqI0OAKsK8H4oR8k/edit?usp=sharing" target="_blank">Link to report</a>

## Summary
`MindfuLLM` will generate a daily quiz based on academic content you've discussed with ChatGPT or Edinburgh's proprietary large language model, in order to reinforce the shallow learning that has happened during the day. 



## Environment Setup

Run `pip install -r requirements.txt` in your desired environment.

## Running the Server

For development purposes: run `fastapi dev main.py` on the project root.

## Generating Quizzes

To generate a quiz, you must submit a POST request to the `/receive` enpoint on the server.
An example is in `test/test_request.py`:

```python
import requests

data = {
        "num_mcq": 7,
        "num_open": 3,
        "user_email": "user@gmail.com",
        "messages": [
            {"conv_id": 0, "role": "user", "content": "Hey, can you tell me a bit about the rise of the Roman Empire?"},
            {"conv_id": 0, "role": "assistant", "content": "Of course! The Roman Empire rose from the Roman Republic around 27 BCE when Augustus became the first emperor. It marked a shift from a republic led by elected officials to a centralized imperial system."},
            ...
        ]
    }

response = requests.post(
    "http://127.0.0.1:8000/receive",
    json=data
)

print(response.status_code)  # Should be 200
print(response.json())       # {"status": "ok"}
```
