from __future__ import annotations
from src.enums.agent import *
from typing import Optional
from copy import deepcopy
from openai import OpenAI
import json

def create_message(role: str, content: str) -> dict:
    return {
        'role': role,
        'content': content
    }

class Conversation:
    def __init__(self) -> None:
        self.messages = []

    def insert(self, i: int, role: str, content: str) -> dict:
       message = create_message(role, content)
       self.messages.insert(i, message)
       return message

    def prepend(self, role: str, content: str) -> dict:
        return self.insert(0, role, content)

    def append(self, role: str, content: str) -> dict:
        return self.insert(len(self), role, content)
    
    def pop(self, i: int = -1) -> dict:
        return self.messages.pop(i)

    def set_system(self, content: str) -> dict:
        system_message = create_message(RoleEnum.SYSTEM.value, content)
        self.messages = [system_message] + [m for m in self.messages if m['role'] != RoleEnum.SYSTEM.value]
        return system_message

    def shorten_to(self, last_n: int) -> Conversation:
        self.messages = [self.messages[0]] + self.messages[-(max(last_n - 1, 0)):]
        return self
    
    def __len__(self) -> int:
        return len(self.messages)
    
    def __getitem__(self, key: INDEX) -> Conversation|dict:
        if isinstance(key, slice):
            conversation = deepcopy(self)
            conversation.messages = self.messages[key.start:key.stop:key.step]
            return conversation
        else:
            return self.messages[key]
    
    def __setitem__(self, key: INDEX, value) -> None:
        if isinstance(key, slice):
            r = range(*key.indices(len(self.messages)))
            if len(r) != len(value):
                raise ValueError('Value length does not equal length of slice')
            for i, v in zip(r, value):
                self.messages[i] = (v)
        else:
            self.messages[key] = value
    
    def __iter__(self) -> dict:
        for message in self.messages:
            yield message

    #for testing only
    def __repr__(self) -> str:
        return '\n'.join((f'{message["role"]}: {message["content"]}' for message in self.messages))

class Agent:
    config = {}

    def __init__(self,
                 config: dict,
                 default_system_prompt: str = '',
                 generation_attempts: int = 5
            ) -> None:
        self.ai = OpenAI(
            base_url = config['base_url'],
            api_key = config['api_key']
        )

        self.chat_model = config["chat_model"]
        self.generation_attempts = generation_attempts

        self.conversation = Conversation()
        
        Agent.config.update({
            RoleEnum.SYSTEM.value: default_system_prompt
        })
        self.conversation.set_system(default_system_prompt)

    def reset_conversation(self) -> None:
        self.conversation = Conversation()

    def send_message(self, content: str) -> dict:
        return self.conversation.append(
            RoleEnum.USER.value,
            content
        )
    
    def receive_response(self, 
                         output_template: dict, 
                         system_prompt: str = "", 
                         auto_append: bool = True) -> dict:
        self.conversation.set_system(system_prompt)

        retries = self.generation_attempts
        content = ""
        while not self.valid_response(content, output_template) and retries > 0:
            retries -= 1
            response = self.ai.chat.completions.create(
                messages = self.conversation.messages,
                model = self.chat_model
            )
            _message = response.choices[0].message
            content = self.postprocess(_message.content)
        if retries == 0:
            if not self.valid_response(content, output_template):
                raise Exception(f"Response generation failed after {self.generation_attempts} attempts.")
        message = create_message(
            RoleEnum.ASSISTANT.value,
            content
        )
        if auto_append:
            self.conversation.append(**message)
        return message
    
    def postprocess(self, content: str) -> str:
        # This postprocessing deems necessary, because the LLM likes to wrap its answer
        # in ```json ```
        return content.strip("```").strip("json")
    
    def _valid_response(self, content: str | dict, output_template: dict) -> bool:
        if content == "":
            return False
        else:
            try:
                if type(content) == str:
                    response = json.loads(content)
                elif type(content) == dict:
                    response = content
                else:
                    print("Wrong content type.")
                    return False
                if set(response.keys()) != set(output_template.keys()):
                    print("Keys do not match.")
                    print(set(response.keys()), set(output_template.keys()))
                    return False
                for key, value in response.items():
                    if type(value) != type(output_template[key]):
                        print("Type mismatch.")
                        print(type(value), type(output_template[key]))
                        return False
                    if type(output_template[key]) == dict:
                        valid = self._valid_response(value, output_template[key])
                        if not valid:
                            print("Value dict invalid.")
                            print(value, output_template[key])
                            return False
            except:
                return False
            return True
    
    def valid_response(self, content: str | list, output_template: dict) -> bool:
        try:
            loaded_content = json.loads(content)
            if type(loaded_content) == dict:
                return self._valid_response(content, output_template)
            elif type(loaded_content) == list:
                valids = [self._valid_response(question, output_template) for question in loaded_content]
                return not (False in valids)
        except:
            return False