"""
challenges/signals.py
──────────────────────
Event-driven leaderboard updates.

Flow on a correct flag submission / hint unlock:
  1. post_save signal fires on the DB commit (via transaction.on_commit).
  2. Signal calls services.update_leaderboard_cache(event_id)  → writes Redis.
  3. Signal calls services.broadcast_leaderboard_update(event_id) → pushes to
     every WS client in the Channels group via Redis pub/sub.

No more file-based IPC.  No more full rebuild on every API request.
"""

import json
import logging
import traceback

from django.db import transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Announcement, UserChallenge, UserHint
from ctf.utils import encode_id

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _refresh_and_broadcast(event_id: int) -> None:
    """Recompute cache + push to WS clients.  Safe to call from any thread."""
    from challenges.services import update_leaderboard_cache, broadcast_leaderboard_update
    payload = update_leaderboard_cache(event_id)
    if payload:
        broadcast_leaderboard_update(event_id, payload)


def _broadcast_group_event(event_id_encoded: str, msg_type: str, data: dict) -> None:
    """
    Push an arbitrary typed message to the per-event Channels group.
    Used for new_submission / announcements.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            f"event_{event_id_encoded}",
            {"type": msg_type, "data": data},
        )
    except Exception:
        logger.exception("_broadcast_group_event failed for event %s type %s", event_id_encoded, msg_type)


def emit_ws_event(event_type: str, data: dict) -> None:
    """
    Public shim kept for backward-compatibility with administration/api_views.py.

    ``data`` must contain an 'event_id' key (encoded hashid string) so we can
    route the message to the correct Channels group.  Falls back to a no-op if
    the key is missing.
    """
    event_id_encoded = data.get("event_id")
    if not event_id_encoded:
        logger.warning("emit_ws_event called without event_id in data: %s", data)
        return
    _broadcast_group_event(event_id_encoded, event_type, data)


# ─────────────────────────────────────────────────────────────────────────────
# Announcement signals
# ─────────────────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Announcement)
def announcement_saved(sender, instance, created, **kwargs):
    event_id_encoded = encode_id(instance.event_id)
    if created:
        _broadcast_group_event(event_id_encoded, "new_announcement", {
            "id": encode_id(instance.id),
            "title": instance.title,
            "content": instance.content,
            "type": instance.type,
            "author": instance.created_by.username if instance.created_by else "Admin",
            "created_at": instance.created_at.isoformat(),
        })
    else:
        _broadcast_group_event(event_id_encoded, "refresh_announcements", {})


@receiver(post_delete, sender=Announcement)
def announcement_deleted(sender, instance, **kwargs):
    _broadcast_group_event(encode_id(instance.event_id), "refresh_announcements", {})


# ─────────────────────────────────────────────────────────────────────────────
# UserChallenge signals
# ─────────────────────────────────────────────────────────────────────────────

@receiver(post_save, sender=UserChallenge)
def user_challenge_saved(sender, instance, created, **kwargs):
    event = instance.challenge.event
    if event is None:
        return

    event_id_encoded = encode_id(event.id)

    # ── Live admin submission feed ────────────────────────────────────────────
    try:
        team_name, team_id_enc = None, None
        try:
            from teams.models import TeamMember
            membership = TeamMember.objects.filter(
                user=instance.user, team__event=event
            ).select_related("team").first()
            if membership:
                team_name = membership.team.name
                team_id_enc = encode_id(membership.team.id)
        except Exception:
            pass

        submission_data = {
            "event_id": event_id_encoded,
            "id": encode_id(instance.id),
            "user_id": encode_id(instance.user_id),
            "username": instance.user.username,
            "challenge_id": encode_id(instance.challenge_id),
            "challenge_title": instance.challenge.title,
            "flag": "CORRECT" if instance.is_correct else instance.submitted_flag,
            "is_correct": instance.is_correct,
            "submitted_at": timezone.localtime(instance.submitted_at).strftime("%Y-%m-%d %I:%M:%S %p"),
            "team_name": team_name,
            "team_id": team_id_enc,
        }
        _broadcast_group_event(event_id_encoded, "new_submission", submission_data)
    except Exception:
        logger.exception("Failed to broadcast new_submission for UserChallenge %s", instance.id)

    # ── Leaderboard refresh — only on correct solves ──────────────────────────
    if instance.is_correct:
        def _do_refresh():
            try:
                _refresh_and_broadcast(event.id)
            except Exception:
                logger.exception("Leaderboard refresh failed after UserChallenge %s", instance.id)

        transaction.on_commit(_do_refresh)


@receiver(post_delete, sender=UserChallenge)
def user_challenge_deleted(sender, instance, **kwargs):
    event = instance.challenge.event
    if event is None:
        return
    transaction.on_commit(lambda: _refresh_and_broadcast(event.id))


# ─────────────────────────────────────────────────────────────────────────────
# UserHint signals
# ─────────────────────────────────────────────────────────────────────────────

@receiver(post_save, sender=UserHint)
@receiver(post_delete, sender=UserHint)
def user_hint_changed(sender, instance, **kwargs):
    try:
        event = instance.hint.challenge.event
    except Exception:
        return
    if event is None:
        return
    transaction.on_commit(lambda: _refresh_and_broadcast(event.id))


# ─────────────────────────────────────────────────────────────────────────────
# Team signals
# ─────────────────────────────────────────────────────────────────────────────

@receiver(post_save, sender="teams.TeamChallenge")
@receiver(post_delete, sender="teams.TeamChallenge")
def team_challenge_changed(sender, instance, **kwargs):
    try:
        event = instance.challenge.event
    except Exception:
        return
    if event is None:
        return
    transaction.on_commit(lambda: _refresh_and_broadcast(event.id))


@receiver(post_save, sender="teams.TeamHint")
@receiver(post_delete, sender="teams.TeamHint")
def team_hint_changed(sender, instance, **kwargs):
    try:
        event = instance.hint.challenge.event
    except Exception:
        return
    if event is None:
        return
    transaction.on_commit(lambda: _refresh_and_broadcast(event.id))
