"""
challenges/services.py
──────────────────────
High-performance leaderboard service.

Architecture:
  1. Redis hash  leaderboard:{event_id}:data   → full ranked JSON (for API reads)
  2. Redis zset  leaderboard:{event_id}:zset   → score sorted set (for O(logN) rank lookup)
  3. Channels group  event_{event_id}          → real-time WS broadcast

Only update_leaderboard_cache() touches the DB.
get_leaderboard_data()  is a pure Redis read — always <5 ms.
"""

import json
import logging
import time
from datetime import datetime

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.db.models import Sum
from django.utils import timezone

from ctf.utils import encode_id

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Key helpers
# ─────────────────────────────────────────────────────────────────────────────
LEADERBOARD_TTL = 60 * 60 * 6  # 6 hours — auto-expire after long events


def _data_key(event_id: int) -> str:
    return f"leaderboard:{event_id}:data"


def _meta_key(event_id: int) -> str:
    return f"leaderboard:{event_id}:meta"


def _lock_key(event_id: int) -> str:
    return f"leaderboard:{event_id}:lock"


def _ws_group(event_id: int) -> str:
    return f"event_{encode_id(event_id)}"


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def get_leaderboard_data(event_id: int) -> dict | None:
    """
    Pure Redis read.  Returns the cached payload or None if the cache is cold.
    Never hits the DB — the caller falls back to compute_and_cache() if None.
    """
    raw = cache.get(_data_key(event_id))
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def update_leaderboard_cache(event_id: int) -> dict | None:
    """
    Recomputes the leaderboard from DB, writes it into Redis, and returns the
    payload.  Called from signals — never from the API view.
    Uses a Redis lock to prevent cache stampedes.
    """
    lock_k = _lock_key(event_id)
    # Try to acquire lock
    acquired = cache.add(lock_k, "1", timeout=30)
    
    if not acquired:
        # Another process is computing it. Wait for up to 5 seconds.
        for _ in range(25):
            time.sleep(0.2)
            payload = get_leaderboard_data(event_id)
            if payload:
                return payload
        logger.warning("Timeout waiting for leaderboard lock for event %s. Computing anyway.", event_id)

    try:
        from administration.models import Event
        try:
            event = Event.objects.select_related().get(pk=event_id)
        except Event.DoesNotExist:
            logger.warning("update_leaderboard_cache: event %s not found", event_id)
            return None

        try:
            payload = _build_payload(event)
        except Exception:
            logger.exception("update_leaderboard_cache: build failed for event %s", event_id)
            return None

        if payload:
            cache.set(_data_key(event_id), payload, timeout=LEADERBOARD_TTL)

        return payload
    finally:
        if acquired:
            cache.delete(lock_k)


def broadcast_leaderboard_update(event_id: int, payload: dict | None = None) -> None:
    """
    Push the leaderboard payload to the Channels group for event_id.
    If payload is not supplied, reads it from Redis.
    """
    if payload is None:
        payload = get_leaderboard_data(event_id)
    if not payload:
        return

    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("broadcast_leaderboard_update: no channel layer configured")
        return

    try:
        # Optimization: Inject Top 10 history directly into the WS broadcast
        # so the frontend graph updates instantly without a second fetch.
        from challenges.services import build_entity_history
        from ctf.utils import decode_id
        
        top_10 = payload.get('leaderboard', [])[:10]
        histories = []
        is_team = payload.get('is_team_mode', False)
        
        from administration.models import Event
        event = Event.objects.get(id=event_id)
        
        for entry in top_10:
            eid = decode_id(entry['id'])
            if eid:
                h = build_entity_history(event, eid, is_team=is_team)
                histories.append({'id': entry['id'], 'history': h})
        
        payload['top_history'] = histories

        async_to_sync(channel_layer.group_send)(
            _ws_group(event_id),
            {
                "type": "leaderboard.update",
                "payload": payload,
            },
        )
    except Exception:
        logger.exception("broadcast_leaderboard_update: channel send failed for event %s", event_id)


def invalidate_leaderboard_cache(event_id: int) -> None:
    """Hard-delete the Redis cache entry (e.g. on admin edit)."""
    cache.delete(_data_key(event_id))


# ─────────────────────────────────────────────────────────────────────────────
# Internal computation — only called by update_leaderboard_cache()
# ─────────────────────────────────────────────────────────────────────────────

def _get_event_start_iso(event) -> str:
    if event.start_date and event.start_time:
        start_dt = datetime.combine(event.start_date, event.start_time)
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        return start_dt.isoformat()
    return (timezone.now() - timezone.timedelta(hours=1)).isoformat()


def _build_payload(event) -> dict | None:
    """
    Single-pass aggregation with minimal DB round-trips.
    Returns the full leaderboard dict (without history — that's the /history/ endpoint).
    """
    if event.is_team_mode:
        return _build_team_payload(event)
    return _build_individual_payload(event)


# ── TEAM ──────────────────────────────────────────────────────────────────────

def _build_team_payload(event) -> dict:
    from teams.models import Team, TeamChallenge, TeamHint

    from django.db.models import Count as DCount
    solve_agg = (
        TeamChallenge.objects
        .filter(team__event=event)
        .values("team_id")
        .annotate(total_pts=Sum("challenge__points"), flags=DCount("id"))
    )
    hint_agg = (
        TeamHint.objects
        .filter(team__event=event)
        .values("team_id")
        .annotate(hint_cost=Sum("hint__cost"))
    )
    last_solve_agg = (
        TeamChallenge.objects
        .filter(team__event=event)
        .order_by("team_id", "-solved_at")
        .distinct("team_id")
        .values("team_id", "solved_at")
    )

    solve_map = {r["team_id"]: (r["total_pts"] or 0, r["flags"] or 0) for r in solve_agg}
    hint_map = {r["team_id"]: (r["hint_cost"] or 0) for r in hint_agg}

    # last_solve_agg uses DISTINCT ON which needs PostgreSQL
    try:
        last_solve_map = {r["team_id"]: r["solved_at"] for r in last_solve_agg}
    except Exception:
        # Fallback for non-Postgres (SQLite dev)
        last_solve_map = {}
        for tc in TeamChallenge.objects.filter(team__event=event).order_by("team_id", "solved_at"):
            last_solve_map[tc.team_id] = tc.solved_at

    teams = (
        Team.objects
        .filter(event=event)
        .select_related("captain")
        .prefetch_related("members__user")
    )

    from challenges.models import Challenge
    total_challenges = Challenge.objects.filter(event=event).count()
    total_points = Challenge.objects.filter(event=event).aggregate(total=Sum("points"))["total"] or 0

    rows = []
    for team in teams:
        raw_pts, flags = solve_map.get(team.id, (0, 0))
        hint_cost = hint_map.get(team.id, 0)
        pts = max(0, raw_pts - hint_cost)
        last_solve = last_solve_map.get(team.id)

        rows.append({
            "id": encode_id(team.id),
            "name": team.name,
            "captain": team.captain.username,
            "members": [m.user.username for m in team.members.all()],
            "member_count": team.members.count(),
            "points": pts,
            "flags": flags,
            "last_solve_time": last_solve.isoformat() if last_solve else None,
            "avatar": f"https://ui-avatars.com/api/?name={team.name}&background=random&color=fff",
        })

    # Sort: points DESC, last_solve_time ASC (earlier = better tie-break)
    rows.sort(key=lambda t: (-t["points"], t["last_solve_time"] or ""))

    team_map = {}
    member_map = {}
    for idx, row in enumerate(rows):
        row["rank"] = idx + 1
        row["totalFlags"] = total_challenges
        row["progress"] = (row["flags"] / total_challenges * 100) if total_challenges else 0
        
        # Rank-based color assignment (Slot 1 always gets Color 1, etc.)
        row["color"] = f"hsl({(idx * 137.5) % 360}, 85%, 60%)"
        
        team_map[row["id"]] = idx
        for member in row["members"]:
            member_map[member] = idx

    return {
        "is_team_mode": True,
        "leaderboard": rows,
        "team_map": team_map,
        "member_map": member_map,
        "event": event.event_name,
        "event_total_points": total_points,
        "event_total_challenges": total_challenges,
    }


# ── INDIVIDUAL ────────────────────────────────────────────────────────────────

def _build_individual_payload(event) -> dict:
    from django.db.models import Count as DCount
    from challenges.models import Challenge, UserChallenge, UserHint
    from dashboard.models import EventAccess

    # ── Aggregated queries — no Python loops ──────────────────────────────────
    solve_agg = (
        UserChallenge.objects
        .filter(challenge__event=event, is_correct=True)
        .values("user_id")
        .annotate(total_pts=Sum("challenge__points"), flags=DCount("id"))
    )
    hint_agg = (
        UserHint.objects
        .filter(hint__challenge__event=event)
        .values("user_id")
        .annotate(hint_cost=Sum("hint__cost"))
    )
    # last correct solve per user
    try:
        last_solve_agg = (
            UserChallenge.objects
            .filter(challenge__event=event, is_correct=True)
            .order_by("user_id", "-submitted_at")
            .distinct("user_id")
            .values("user_id", "submitted_at")
        )
        last_solve_map = {r["user_id"]: r["submitted_at"] for r in last_solve_agg}
    except Exception:
        last_solve_map = {}
        for uc in UserChallenge.objects.filter(challenge__event=event, is_correct=True).order_by("user_id", "submitted_at"):
            last_solve_map[uc.user_id] = uc.submitted_at

    solve_map = {r["user_id"]: (r["total_pts"] or 0, r["flags"] or 0) for r in solve_agg}
    hint_map = {r["user_id"]: (r["hint_cost"] or 0) for r in hint_agg}

    # 1. Get explicitly banned users
    banned_uids = set(EventAccess.objects.filter(event=event, is_banned=True).values_list("user_id", flat=True))

    # 2. Get registered users
    registered_accesses = EventAccess.objects.filter(event=event, is_registered=True).select_related("user")
    user_dict = {acc.user_id: acc.user for acc in registered_accesses if acc.user_id not in banned_uids}

    # 3. Get any user who has submitted a challenge (e.g. admins testing challenges without registering)
    active_uids = set(UserChallenge.objects.filter(challenge__event=event).values_list("user_id", flat=True))
    missing_uids = active_uids - set(user_dict.keys()) - banned_uids

    if missing_uids:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        missing_users = User.objects.filter(id__in=missing_uids)
        for u in missing_users:
            user_dict[u.id] = u

    total_challenges = Challenge.objects.filter(event=event).count()
    total_points = Challenge.objects.filter(event=event).aggregate(total=Sum("points"))["total"] or 0

    rows = []
    for uid, user in user_dict.items():
        raw_pts, flags = solve_map.get(uid, (0, 0))
        hint_cost = hint_map.get(uid, 0)
        pts = max(0, raw_pts - hint_cost)
        last_solve = last_solve_map.get(uid)

        rows.append({
            "id": encode_id(uid),
            "username": user.username,
            "team": "Hack!t",
            "points": pts,
            "flags": flags,
            "last_solve_time": last_solve.isoformat() if last_solve else None,
            "avatar": f"https://ui-avatars.com/api/?name={user.username}&background=random&color=fff",
        })

    rows.sort(key=lambda u: (-u["points"], u["last_solve_time"] or ""))

    user_map = {}
    for idx, row in enumerate(rows):
        row["rank"] = idx + 1
        row["totalFlags"] = total_challenges
        row["maxPoints"] = total_points or 15000
        row["progress"] = (row["flags"] / total_challenges * 100) if total_challenges else 0
        
        # Rank-based color assignment (Slot 1 always gets Color 1, etc.)
        row["color"] = f"hsl({(idx * 137.5) % 360}, 85%, 60%)"
        
        user_map[row["id"]] = idx

    return {
        "is_team_mode": False,
        "leaderboard": rows,
        "user_map": user_map,
        "event": event.event_name,
        "event_total_points": total_points,
        "event_total_challenges": total_challenges,
    }


# ─────────────────────────────────────────────────────────────────────────────
# History builder — called from the dedicated /history/ endpoint only
# ─────────────────────────────────────────────────────────────────────────────

def build_entity_history(event, entity_id: int, is_team: bool) -> list:
    """
    Build the score timeline for a single user or team.
    Returns a list of history dicts sorted by timestamp.
    Heavy — should only be called on-demand, not on every leaderboard request.
    """
    cache_key = f"leaderboard:{event.id}:history:{'team' if is_team else 'user'}:{entity_id}"
    cached = cache.get(cache_key)
    if cached:
        try:
            return json.loads(cached) if isinstance(cached, str) else cached
        except Exception:
            pass

    from challenges.models import UserChallenge, UserHint

    event_start_iso = _get_event_start_iso(event)
    timeline = []

    if is_team:
        from teams.models import TeamChallenge, TeamHint
        for tc in TeamChallenge.objects.filter(team_id=entity_id).select_related("challenge").order_by("solved_at"):
            timeline.append({"type": "solve", "name": tc.challenge.title, "delta": tc.challenge.points, "ts": tc.solved_at})
        for th in TeamHint.objects.filter(team_id=entity_id).select_related("hint__challenge").order_by("unlocked_at"):
            timeline.append({"type": "hint", "name": f"Hint: {th.hint.challenge.title}", "delta": -th.hint.cost, "ts": th.unlocked_at})
    else:
        seen = set()
        for uc in UserChallenge.objects.filter(user_id=entity_id, challenge__event=event, is_correct=True).select_related("challenge").order_by("submitted_at"):
            if uc.challenge_id in seen:
                continue
            seen.add(uc.challenge_id)
            timeline.append({"type": "solve", "name": uc.challenge.title, "delta": uc.challenge.points, "ts": uc.submitted_at})
        for uh in UserHint.objects.filter(user_id=entity_id, hint__challenge__event=event).select_related("hint__challenge").order_by("unlocked_at"):
            timeline.append({"type": "hint", "name": f"Hint: {uh.hint.challenge.title}", "delta": -uh.hint.cost, "ts": uh.unlocked_at})

    timeline.sort(key=lambda x: x["ts"])

    history = [{"flagName": "Event Start", "points": 0, "total": 0, "timestamp": "Start", "rawTime": event_start_iso, "id": "start"}]
    score = 0
    for evt in timeline:
        score = max(0, score + evt["delta"])
        history.append({
            "flagName": evt["name"],
            "points": evt["delta"],
            "total": score,
            "timestamp": evt["ts"].strftime("%H:%M"),
            "rawTime": evt["ts"].isoformat(),
            "id": f"{evt['type']}-{evt['ts'].timestamp()}",
        })
    history.append({"flagName": "Current", "points": 0, "total": score, "timestamp": "Now", "rawTime": timezone.now().isoformat(), "id": "now"})
    cache.set(cache_key, history, timeout=60)
    return history
