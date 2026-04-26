"""
ctf/consumers.py
────────────────
Django Channels WebSocket consumer.

Per-event channel groups replace the old file-based IPC:
  • Clients connect to  /ws/event/<event_id>/
  • On connect they join group  event_<event_id>
  • services.broadcast_leaderboard_update() sends to that group
  • Consumer forwards the message to every connected client

This scales horizontally — add more Daphne workers and the Redis channel
layer handles fan-out automatically.
"""

import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class CTFUpdateConsumer(AsyncWebsocketConsumer):
    """
    WebSocket handler for a single CTF event.

    URL param  ``event_id``  is the *encoded* event hash-id passed in the URL
    (e.g. /ws/event/qOVpKyLg/).  We use it directly as part of the group name
    so there is no DB lookup on connect.
    """

    async def connect(self):
        self.event_id = self.scope["url_route"]["kwargs"]["event_id"]
        self.group_name = f"event_{self.event_id}"

        # Join the per-event group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.debug("WS connect: %s joined %s", self.channel_name, self.group_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.debug("WS disconnect: %s left %s (code=%s)", self.channel_name, self.group_name, close_code)

    async def receive(self, text_data=None, bytes_data=None):
        # Clients are read-only — ignore any incoming messages.
        pass

    # ── Group message handlers ────────────────────────────────────────────────
    # The method name must match  type  in group_send with dots replaced by underscores.

    async def leaderboard_update(self, event):
        """Forwarded from services.broadcast_leaderboard_update()."""
        await self.send(text_data=json.dumps({
            "type": "leaderboard_update",
            "data": event["payload"],
        }))

    async def new_submission(self, event):
        """Forwarded from signals for the live admin feed."""
        user = self.scope.get("user")
        if user and user.is_authenticated and (user.is_staff or user.is_superuser):
            await self.send(text_data=json.dumps({
                "type": "new_submission",
                "data": event["data"],
            }))

    async def new_announcement(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_announcement",
            "data": event["data"],
        }))

    async def refresh_announcements(self, event):
        await self.send(text_data=json.dumps({
            "type": "refresh_announcements",
            "data": {},
        }))

    async def challenge_updated(self, event):
        """Forwarded when admin creates/edits/deletes a challenge."""
        await self.send(text_data=json.dumps({
            "type": "challenge_updated",
            "data": event.get("data", {}),
        }))

    async def waves_updated(self, event):
        """Forwarded when admin opens/closes/edits a wave."""
        await self.send(text_data=json.dumps({
            "type": "waves_updated",
            "data": event.get("data", {}),
        }))
