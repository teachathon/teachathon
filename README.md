# MindfuLLM: LLM Comprehension Quiz Generation

## To view our report on this project, click here: <a href="https://docs.google.com/document/d/1j4v1ITYjrSelpK56IqW31xNUDVgVqI0OAKsK8H4oR8k/edit?usp=sharing" target="_blank">Link to report</a>

## Summary
`MindfuLLM` will generate a daily quiz based on academic content you've discussed with ChatGPT or Edinburgh's proprietary large language model, in order to reinforce the shallow learning that has happened during the day. 

**This is the JavaScript/Node.js version.**

## Environment Setup

Run `npm install` in your desired environment.

## Running the Server

For development purposes: run `npm run dev` on the project root.

For production: run `npm start` on the project root.

## Generating Quizzes

To generate a quiz, you must submit a POST request to the `/receive` endpoint on the server.
An example is in `test/test_request.js`:

```javascript
import fetch from 'node-fetch';

const data = {
    "num_mcq": 7,
    "num_open": 3,
    "user_email": "user@gmail.com",
    "messages": [
        {"conv_id": 0, "role": "user", "content": "Hey, can you tell me a bit about the rise of the Roman Empire?"},
        {"conv_id": 0, "role": "assistant", "content": "Of course! The Roman Empire rose from the Roman Republic around 27 BCE..."},
        ...
    ]
};

const response = await fetch(
    "http://127.0.0.1:8000/receive",
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }
);

console.log(response.status);  // Should be 200
console.log(await response.json());  // {"status": "ok"}
```
