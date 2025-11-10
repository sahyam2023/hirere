import time
from collections import defaultdict
from typing import Dict, Tuple

# Defines the cool-down period in seconds between alerts of the same type.
ALERT_COOLDOWN_SECONDS = 10

class ProctoringState:
    """
    Manages the real-time proctoring state for a single user during an exam.
    """
    def __init__(self):
        self.face_missing_frames: int = 0
        self.multi_face_frames: int = 0
        self.identity_mismatch_frames: int = 0
        
        self.last_alert_timestamp: Dict[str, float] = {
            "no_face": 0.0,
            "multi_face": 0.0,
            "identity_mismatch": 0.0,
        }

    def can_trigger_alert(self, event_type: str) -> bool:
        """
        Checks if a new alert can be triggered for a given event type.
        """
        current_time = time.time()
        last_alert_time = self.last_alert_timestamp.get(event_type, 0.0)
        time_since_last = current_time - last_alert_time
        can_trigger = time_since_last > ALERT_COOLDOWN_SECONDS
        
        # --- DEBUG LINE ---
        print(f"  [COOL-DOWN CHECK | {event_type}]: Time since last alert: {time_since_last:.2f}s. Cool-down: {ALERT_COOLDOWN_SECONDS}s. Can trigger?: {can_trigger}")
        
        return can_trigger

    def record_alert(self, event_type: str):
        """
        Records the current time as the last alert timestamp for an event type.
        """
        self.last_alert_timestamp[event_type] = time.time()
        # --- DEBUG LINE ---
        print(f"  [ALERT RECORDED]: New timestamp for '{event_type}' is {self.last_alert_timestamp[event_type]}")


# In-memory store for user proctoring states
_user_states: Dict[Tuple[int, int], ProctoringState] = defaultdict(ProctoringState)

def get_user_state(user_id: int, exam_id: int) -> ProctoringState:
    """
    Retrieves or creates the proctoring state for a specific user and exam.
    """
    return _user_states[(user_id, exam_id)]