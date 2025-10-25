from pydantic import BaseModel
from typing import List

class Message(BaseModel):
    conv_id: int
    role: str
    content: str

class ExtensionData(BaseModel):
    user_email: str
    num_mcq: int
    num_open: int
    messages: List[Message]