from enum import Enum
from typing import Union

INDEX = Union[int, slice]

class RoleEnum(Enum):
    SYSTEM = 'system'
    USER = 'user'
    ASSISTANT = 'assistant'