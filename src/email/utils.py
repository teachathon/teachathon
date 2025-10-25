'''
Utilities for building the e-mail.
'''

def build_email_body(form_url: str) -> str:
    return ("Hello!\n\n"
            "Your MindfuLLM quiz is ready:\n"
            f"{form_url}\n\n"
            "Recall and testing has been empirically shown to improve learning outcomes significantly. Enjoy your increased mastery!\n\n"
            "You can share this link with others, or open it to make further edits and tweaks.\n\n"
            "If you want to learn more about MindfuLLM, visit https://github.com/teachathon/teachathon.\n\n"
            "Best,\n"
            "MindfuLLM Team")