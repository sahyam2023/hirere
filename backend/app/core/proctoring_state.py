from collections import defaultdict
from typing import Dict, Optional

class ProctoringState:
    def __init__(self):
        self.face_missing_frames = 0
        self.multi_face_frames = 0
        self.last_event = "face_ok"

# In-memory store for user proctoring states.
# This is a simple solution for now. For a more robust system, you might use Redis.
_user_states: Dict[int, ProctoringState] = defaultdict(ProctoringState)

def get_user_state(user_id: int) -> ProctoringState:
    return _user_states[user_id]
