import requests

data = {
        "user_email": "...",
        "num_mcq": 3,
        "num_open": 3,
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
            {"conv_id": 0, "role": "assistant", "content": "Roughly 200 years, from 27 BCE to around 180 CE. It wasn’t completely free of conflict, but compared to earlier chaos, it was a golden age for Rome."},
            {"conv_id": 0, "role": "user", "content": "Cool! By the way, how do I check my current directory in the terminal again?"},
            {"conv_id": 0, "role": "assistant", "content": "You can use the command `pwd` (print working directory) to see where you are in the filesystem."},
            {"conv_id": 0, "role": "user", "content": "Oh right. And how do I list all files, including hidden ones?"},
            {"conv_id": 0, "role": "assistant", "content": "Use `ls -a` — it shows all files, including those starting with a dot (which are hidden by default)."},
            {"conv_id": 0, "role": "user", "content": "Thanks. Back to Rome — who came after Augustus?"},
            {"conv_id": 0, "role": "assistant", "content": "Tiberius succeeded Augustus. He was his stepson and continued his policies, though he became increasingly reclusive later in life."},
            {"conv_id": 0, "role": "user", "content": "Got it. By the way, how can I check how much free disk space I have?"},
            {"conv_id": 0, "role": "assistant", "content": "Use `df -h` — it displays disk usage in a human-readable format (like GB or MB)."},
            {"conv_id": 0, "role": "user", "content": "Also, can you make me a simple receipt for two cappuccinos and one croissant?"},
            {"conv_id": 0, "role": "assistant", "content": "Sure! Here's a simple receipt:\n\n**Receipt**\n- 2 × Cappuccino — €6.00\n- 1 × Croissant — €2.50\n**Total:** €8.50\n**Thank you for your purchase! ☕🥐**"},
            {"conv_id": 0, "role": "user", "content": "Haha nice. Oh, one more Linux thing — how do I search for a file by name?"},
            {"conv_id": 0, "role": "assistant", "content": "You can use `find / -name filename.txt` to search the entire system, or limit it to a directory like `find . -name filename.txt` to stay local."},
            {"conv_id": 0, "role": "user", "content": "Perfect. I’m also thinking of visiting Rome soon—what are the top historical sites I shouldn’t miss?"},
            {"conv_id": 0, "role": "assistant", "content": "That’s exciting! Don’t miss the Colosseum, Roman Forum, Pantheon, Palatine Hill, and the Vatican Museums. Try to walk around the Trastevere district too—it’s full of charm and history."},
            {"conv_id": 0, "role": "user", "content": "Nice, I’ll add those to my list. Maybe I’ll see where Caesar was assassinated too."},
            {"conv_id": 0, "role": "assistant", "content": "You can! The Largo di Torre Argentina is the spot—now it’s actually a cat sanctuary built around the ruins."},
            {"conv_id": 0, "role": "user", "content": "By the way, how do I check my system’s uptime?"},
            {"conv_id": 0, "role": "assistant", "content": "You can run `uptime` — it shows how long your system has been running, the number of users, and load averages."},
            {"conv_id": 0, "role": "user", "content": "Cool, I’ll try that later. Rome and Linux — not a bad combo today!"},
            {"conv_id": 0, "role": "assistant", "content": "Haha, indeed! Mastering the command line and exploring ancient empires — both take curiosity and discipline."}
        ]
    }

response = requests.post(
    "http://127.0.0.1:8000/receive",
    json=data
)

print(response.status_code)  # Should be 200
print(response.json())       # {"status": "ok"}