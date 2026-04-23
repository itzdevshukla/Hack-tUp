"""
ctf/routing.py
──────────────
WebSocket URL patterns.

/ws/event/<event_id>/   — per-event leaderboard + announcements stream
                          event_id is the encoded hash-id string (e.g. qOVpKyLg)

The old /ws/updates/ global endpoint is kept as a redirect-alias so any
existing frontend connections don't hard-crash before the UI is updated.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # New per-event endpoint (preferred)
    re_path(r"ws/event/(?P<event_id>[A-Za-z0-9]+)/$", consumers.CTFUpdateConsumer.as_asgi()),

    # Legacy global endpoint — maps to a dummy event_id so the consumer
    # can still connect without errors; frontend should migrate to the new URL.
    re_path(r"ws/updates/$", consumers.CTFUpdateConsumer.as_asgi(), kwargs={"event_id": "global"}),
]
