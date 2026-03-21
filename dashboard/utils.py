from django.shortcuts import redirect
from administration.models import Event

def event_user_guard(request, event):
    """
    Blocks access to event pages if event is completed.
    """

    # 🔄 Always refresh status
    event.status = event.get_current_status()
    event.save(update_fields=["status"])

    # 🚫 Event completed → redirect
    if event.status == "completed":
        return redirect("event_ended", event_id=event.id)

    return None
