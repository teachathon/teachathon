import requests

data = {
        "num_mcq": 1,
        "num_open": 1,
        "messages": [
            {"conv_id": 0, "role": "user", "content": "Hey, can you tell me a bit about the rise of the Roman Empire?"},
            {"conv_id": 0, "role": "assistant", "content": "Of course! The Roman Empire rose from the Roman Republic around 27 BCE when Augustus became the first emperor. It marked a shift from a republic led by elected officials to a centralized imperial system."},
            {"conv_id": 0, "role": "user", "content": "Interesting! What caused the Republic to fall?"},
            {"conv_id": 0, "role": "assistant", "content": "The Republic fell due to political corruption, power struggles among generals like Julius Caesar and Pompey, and civil wars that destabilized the state."},
            {"conv_id": 0, "role": "user", "content": "So was Julius Caesar technically an emperor?"},
            {"conv_id": 0, "role": "assistant", "content": "Not officially. He held dictatorial power but was assassinated before he could establish a monarchy. His death paved the way for his heir, Octavian—later Augustus—to become the first emperor."},
            {"conv_id": 0, "role": "user", "content": "Ah, I see. What was the empire like under Augustus?"},
            {"conv_id": 0, "role": "assistant", "content": "Augustus brought stability, reformed the government, and started the Pax Romana—a long period of peace and prosperity across the empire."},
            {"conv_id": 0, "role": "user", "content": "How long did that peace last?"},
            {"conv_id": 0, "role": "assistant", "content": "Roughly 200 years, from 27 BCE to around 180 CE. It wasn’t completely free of conflict, but compared to earlier chaos, it was a golden age for Rome."}
        ]
    }

response = requests.post(
    "http://127.0.0.1:8000/receive",
    json=data
)

print(response.status_code)  # Should be 200
print(response.json())       # {"status": "ok"}