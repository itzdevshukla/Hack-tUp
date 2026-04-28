import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone

from administration.models import Event
from dashboard.models import EventAccess
from ctf.utils import encode_id
from .models import Team, TeamMember, TeamChallenge, TeamJoinRequest


# ─────────────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────────────

def _get_user_team(user, event):
    """Return the Team the user belongs to in the given event, or None."""
    membership = TeamMember.objects.filter(user=user, team__event=event).select_related("team").first()
    return membership.team if membership else None


def _serialize_team(team, request_user=None):
    members = team.members.select_related("user").order_by("joined_at")
    
    from .models import TeamChallenge
    from django.db.models import Sum
    
    serialized_members = []
    for m in members:
        user_points = TeamChallenge.objects.filter(
            team=team, solved_by=m.user
        ).aggregate(total=Sum("challenge__points"))["total"] or 0
        
        serialized_members.append({
            "username": m.user.username,
            "is_captain": m.user_id == team.captain_id,
            "is_me": (request_user is not None and m.user_id == request_user.id),
            "joined_at": m.joined_at.isoformat(),
            "points": user_points
        })

    # Pending join requests (for captain view)
    pending_requests = []
    if request_user and team.captain_id == request_user.id:
        for req in team.join_requests.filter(status='pending').select_related('user'):
            pending_requests.append({
                "id": encode_id(req.id),
                "username": req.user.username,
                "created_at": req.created_at.isoformat(),
            })

    return {
        "id": encode_id(team.id),
        "name": team.name,
        "invite_code": team.invite_code,
        "captain": team.captain.username,
        "members": serialized_members,
        "member_count": members.count(),
        "total_points": team.total_points,
        "created_at": team.created_at.isoformat(),
        "pending_requests": pending_requests,
    }


# ─────────────────────────────────────────────────────────────────────
# LIST TEAMS  –  GET /api/teams/event/<event_id>/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_GET
def list_teams_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    teams = Team.objects.filter(event=event).prefetch_related("members")
    data = [
        {
            "id": encode_id(t.id),
            "name": t.name,
            "captain": t.captain.username,
            "member_count": t.members.count(),
            "total_points": t.total_points,
        }
        for t in teams
    ]
    return JsonResponse({"teams": data})


# ─────────────────────────────────────────────────────────────────────
# MY TEAM  –  GET /api/teams/event/<event_id>/my-team/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_GET
def my_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    team = _get_user_team(request.user, event)
    if not team:
        # Check for pending/rejected request
        pending = TeamJoinRequest.objects.filter(
            user=request.user,
            team__event=event,
            status='pending'
        ).select_related('team').first()
        if pending:
            return JsonResponse({
                "team": None,
                "pending_request": {
                    "id": encode_id(pending.id),
                    "team_id": encode_id(pending.team.id),
                    "team_name": pending.team.name,
                    "created_at": pending.created_at.isoformat(),
                }
            })
        rejected = TeamJoinRequest.objects.filter(
            user=request.user,
            team__event=event,
            status='rejected'
        ).select_related('team').order_by('-updated_at').first()
        if rejected:
            return JsonResponse({
                "team": None,
                "rejected_request": {
                    "team_name": rejected.team.name,
                }
            })
        return JsonResponse({"team": None, "pending_request": None})

    return JsonResponse({"team": _serialize_team(team, request.user), "pending_request": None})


# ─────────────────────────────────────────────────────────────────────
# CREATE TEAM  –  POST /api/teams/event/<event_id>/create/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def create_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    access = EventAccess.objects.filter(user=request.user, event=event, is_registered=True).first()
    if not access:
        return JsonResponse({"error": "You must be registered for this event first."}, status=403)

    from django.db import transaction
    with transaction.atomic():
        # Lock this user's registration status for this event
        access = EventAccess.objects.select_for_update().get(user=request.user, event=event)

        if access.is_banned:
            return JsonResponse({"error": "You are banned from this event."}, status=403)

        if _get_user_team(request.user, event):
            return JsonResponse({"error": "You are already in a team for this event."}, status=400)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        team_name = (body.get("name") or "").strip()
        if not team_name:
            return JsonResponse({"error": "Team name is required."}, status=400)
        if len(team_name) > 100:
            return JsonResponse({"error": "Team name is too long (max 100 chars)."}, status=400)

        if Team.objects.filter(event=event, name__iexact=team_name).exists():
            return JsonResponse({"error": "A team with this name already exists for this event."}, status=400)

        from django.db import IntegrityError
        try:
            team = Team.objects.create(event=event, name=team_name, captain=request.user)
            # Captain auto-joins as a member (no approval needed)
            TeamMember.objects.create(team=team, user=request.user)
        except IntegrityError:
            return JsonResponse({"error": "A team with this name already exists for this event."}, status=400)

        return JsonResponse({"success": True, "team": _serialize_team(team, request.user)}, status=201)


# ─────────────────────────────────────────────────────────────────────
# JOIN TEAM (REQUEST)  –  POST /api/teams/event/<event_id>/join/
# Now creates a pending join request instead of immediately joining.
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def join_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    access = EventAccess.objects.filter(user=request.user, event=event, is_registered=True).first()
    if not access:
        return JsonResponse({"error": "You must be registered for this event first."}, status=403)

    from django.db import transaction
    with transaction.atomic():
        # Lock this user's registration status for this event
        access = EventAccess.objects.select_for_update().get(user=request.user, event=event)

        if access.is_banned:
            return JsonResponse({"error": "You are banned from this event."}, status=403)

        if _get_user_team(request.user, event):
            return JsonResponse({"error": "You are already in a team for this event."}, status=400)

        # Check for an active pending request
        existing = TeamJoinRequest.objects.filter(user=request.user, team__event=event, status='pending').first()
        if existing:
            return JsonResponse({"error": "You already have a pending join request. Please wait for the captain to respond."}, status=400)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        invite_code = (body.get("invite_code") or "").strip()
        if not invite_code:
            return JsonResponse({"error": "invite_code is required."}, status=400)

        team = Team.objects.filter(event=event, invite_code=invite_code).first()
        if not team:
            return JsonResponse({"error": "Invalid invite code. Please check and try again."}, status=404)

        if team.members.count() >= event.max_team_size:
            return JsonResponse({"error": f"This team is full ({event.max_team_size} members max)."}, status=400)

        # Create or reactivate a join request (handles re-request after rejection)
        req, created = TeamJoinRequest.objects.update_or_create(
            team=team, user=request.user,
            defaults={'status': 'pending'}
        )

        return JsonResponse({
            "success": True,
            "pending": True,
            "request": {
                "id": encode_id(req.id),
                "team_name": team.name,
                "created_at": req.created_at.isoformat(),
            }
        })


# ─────────────────────────────────────────────────────────────────────
# CANCEL JOIN REQUEST  –  POST /api/teams/requests/<request_id>/cancel/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def cancel_join_request_api(request, request_id):
    join_request = get_object_or_404(TeamJoinRequest, id=request_id)

    if join_request.user_id != request.user.id:
        return JsonResponse({"error": "This is not your request."}, status=403)

    if join_request.status != 'pending':
        return JsonResponse({"error": "This request is no longer pending."}, status=400)

    join_request.status = 'cancelled'
    join_request.save(update_fields=['status', 'updated_at'])
    return JsonResponse({"success": True})


# ─────────────────────────────────────────────────────────────────────
# APPROVE / REJECT JOIN REQUEST  –  POST /api/teams/<team_id>/requests/<request_id>/
# Captain only
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def handle_join_request_api(request, team_id, request_id):
    from django.db import transaction
    with transaction.atomic():
        team = get_object_or_404(Team.objects.select_for_update(), id=team_id)

        if team.captain_id != request.user.id:
            return JsonResponse({"error": "Only the team captain can manage join requests."}, status=403)

        join_request = get_object_or_404(TeamJoinRequest, id=request_id, team=team)

        if join_request.status != 'pending':
            return JsonResponse({"error": "This request is no longer pending."}, status=400)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        action = (body.get("action") or "").strip()
        if action not in ("approve", "reject"):
            return JsonResponse({"error": "action must be 'approve' or 'reject'."}, status=400)

        if action == "approve":
            # ── CONCURRENCY LOCK ─────────────────────────────────────────────
            # Lock the target user's event access to prevent them from being
            # approved into another team simultaneously.
            target_access = EventAccess.objects.select_for_update().filter(
                user=join_request.user, 
                event=team.event
            ).first()
            
            # Check if user is already in a team for this event
            if _get_user_team(join_request.user, team.event):
                join_request.status = 'cancelled'
                join_request.save(update_fields=['status', 'updated_at'])
                return JsonResponse({"error": "This user is already in another team. The request has been cancelled."}, status=400)

            # Check capacity
            event = team.event
            if team.members.count() >= event.max_team_size:
                return JsonResponse({"error": f"Team is full ({event.max_team_size} members max)."}, status=400)
            
            # Final verification
            if TeamMember.objects.filter(team=team, user=join_request.user).exists():
                join_request.status = 'approved'
                join_request.save(update_fields=['status', 'updated_at'])
                return JsonResponse({"success": True, "action": "approve", "message": "Already a member."})

            TeamMember.objects.create(team=team, user=join_request.user)
            join_request.status = 'approved'
            join_request.save(update_fields=['status', 'updated_at'])
            
            # Invalidate other pending requests for this user in this event
            TeamJoinRequest.objects.filter(
                user=join_request.user, 
                team__event=team.event, 
                status='pending'
            ).exclude(id=join_request.id).update(status='cancelled')

            return JsonResponse({"success": True, "action": "approve", "username": join_request.user.username})

        else:  # reject
            join_request.status = 'rejected'
            join_request.save(update_fields=['status', 'updated_at'])
            return JsonResponse({"success": True, "action": "reject", "username": join_request.user.username})


# ─────────────────────────────────────────────────────────────────────
# LEAVE TEAM  –  POST /api/teams/<team_id>/leave/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def leave_team_api(request, team_id):
    from django.db import transaction
    with transaction.atomic():
        # Lock the team to prevent race conditions (Zombie Teams)
        team = get_object_or_404(Team.objects.select_for_update(), id=team_id)
        
        member = TeamMember.objects.filter(team=team, user=request.user).first()
        if not member:
            return JsonResponse({"error": "You are not a member of this team."}, status=400)

        is_captain = team.captain_id == request.user.id
        other_members = team.members.exclude(user=request.user)

        if is_captain:
            if other_members.exists():
                new_captain_member = other_members.order_by("joined_at").first()
                team.captain = new_captain_member.user
                team.save(update_fields=["captain"])
            else:
                team.delete()
                return JsonResponse({"success": True, "message": "Team disbanded as you were the last member."})

        member.delete()
        return JsonResponse({"success": True, "message": "You have left the team."})


# ─────────────────────────────────────────────────────────────────────
# KICK MEMBER  –  POST /api/teams/<team_id>/kick/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def kick_member_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)

    if team.captain_id != request.user.id:
        return JsonResponse({"error": "Only the team captain can kick members."}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    target_username = (body.get("username") or "").strip()
    if not target_username:
        return JsonResponse({"error": "username of the member to kick is required."}, status=400)

    if target_username == request.user.username:
        return JsonResponse({"error": "You cannot kick yourself. Use leave instead."}, status=400)

    member = TeamMember.objects.filter(team=team, user__username=target_username).first()
    if not member:
        return JsonResponse({"error": "That user is not a member of your team."}, status=404)

    member.delete()
    return JsonResponse({"success": True, "message": f"{target_username} has been removed from the team."})
