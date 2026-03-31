from ctf.utils import encode_id
import json
import logging
from django_ratelimit.decorators import ratelimit
from django.db import models
from django.http import JsonResponse
from django.db.models import Sum, Count, F, Window
from django.db.models.functions import RowNumber
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from datetime import datetime

from administration.models import Event
from administration.api_views import is_admin
from dashboard.models import EventAccess
from challenges.models import Challenge, UserChallenge, UserHint, ChallengeHint, Announcement, WriteUp

logger = logging.getLogger(__name__)

@login_required
def event_writeups_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    access = EventAccess.objects.filter(user=request.user, event=event, is_registered=True).first()
    if not access:
        return JsonResponse({'error': 'Not registered'}, status=403)

    if request.method == 'GET':
        wus = WriteUp.objects.filter(user=request.user, challenge__event=event)
        data = [{'challenge_id': encode_id(w.challenge.id), 'content': w.content} for w in wus]
        return JsonResponse({'writeups': data})

    elif request.method == 'POST':
        if not event.accepting_writeups:
            return JsonResponse({'error': 'Write-up submission is currently closed for this event.'}, status=403)
            
        body = json.loads(request.body)
        challenge_id_encoded = body.get('challenge_id')
        content = body.get('content', '')

        from ctf.utils import decode_id
        challenge_id = decode_id(challenge_id_encoded)
        if challenge_id is None:
            return JsonResponse({'error': 'Invalid challenge ID.'}, status=400)

        challenge = get_object_or_404(Challenge, id=challenge_id, event=event)

        # Only allow writeups for solved challenges
        if not UserChallenge.objects.filter(user=request.user, challenge=challenge, is_correct=True).exists():
            return JsonResponse({'error': 'You have not solved this challenge yet.'}, status=403)

        wu, _ = WriteUp.objects.update_or_create(
            user=request.user, challenge=challenge,
            defaults={'content': content}
        )
        return JsonResponse({'success': True})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required
@require_GET
def event_challenges_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    
    # Check access
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    if not access or not access.is_registered:
         return JsonResponse({'error': 'Not registered', 'event': event.event_name}, status=403)

    # Block access if event hasn't started yet
    current_status = event.get_current_status()
    if current_status in ('upcoming', 'pending'):
        return JsonResponse({'error': f'This event has not started yet. Current status: {current_status.upper()}', 'event': event.event_name}, status=403)

    # Pass the ban status to the frontend so it can render a specific ban page
    is_banned = access.is_banned
    challenges = Challenge.objects.filter(
        event=event
    ).filter(
        models.Q(wave__isnull=True) | models.Q(wave__is_active=True)
    ).order_by('category', 'points')
    
    # Check for team requirement
    is_team_mode = event.is_team_mode
    needs_team = False
    if is_team_mode:
        from teams.models import TeamMember
        has_team = TeamMember.objects.filter(user=request.user, team__event=event).exists()
        if not has_team:
            needs_team = True
    
    if needs_team:
        return JsonResponse({
            'event': event.event_name,
            'status': event.get_current_status(),
            'is_banned': is_banned,
            'is_team_mode': True,
            'needs_team': True,
            'challenges': []
        })
            
    # Pre-fetch personally solved challenges for this user
    personally_solved_ids = set(UserChallenge.objects.filter(
        user=request.user,
        challenge__event=event,
        is_correct=True
    ).values_list('challenge_id', flat=True))

    # Pre-fetch solves count and first bloods if possible, or keep simple but avoiding N+1
    if is_team_mode:
        from teams.models import TeamChallenge, TeamMember
        user_team_member = TeamMember.objects.filter(user=request.user, team__event=event).first()
        user_team = user_team_member.team if user_team_member else None
        
        # Get team solves for the user's team
        solved_ids = set(TeamChallenge.objects.filter(
            team=user_team,
            challenge__event=event
        ).values_list('challenge_id', flat=True)) if user_team else set()

        # Solves count per challenge (Global)
        from django.db.models import Count
        global_solves = TeamChallenge.objects.filter(challenge__event=event).values('challenge_id').annotate(count=Count('id'))
        solves_map = {item['challenge_id']: item['count'] for item in global_solves}
    else:
        solved_ids = personally_solved_ids
        # Solves count per challenge (Global)
        from django.db.models import Count
        global_solves = UserChallenge.objects.filter(challenge__event=event, is_correct=True).values('challenge_id').annotate(count=Count('id'))
        solves_map = {item['challenge_id']: item['count'] for item in global_solves}

    challenges_data = []
    for challenge in challenges:
        solves_count = solves_map.get(challenge.id, 0)
        is_personally_solved = challenge.id in personally_solved_ids
        
        # Get first blood (still slightly N+1 but better than before, can be further optimized if needed)
        first_blood_rcd = None
        fb_data = None
        if is_team_mode:
            from teams.models import TeamChallenge
            first_blood_rcd = TeamChallenge.objects.filter(challenge=challenge).order_by('solved_at').select_related('team').first()
            if first_blood_rcd:
                fb_data = {
                    'username': first_blood_rcd.team.name,
                    'time': first_blood_rcd.solved_at
                }
        else:
            first_blood_rcd = UserChallenge.objects.filter(challenge=challenge, is_correct=True).order_by('submitted_at').select_related('user').first()
            if first_blood_rcd:
                fb_data = {
                    'username': first_blood_rcd.user.username,
                    'time': first_blood_rcd.submitted_at
                }
            
        challenges_data.append({
            'id': encode_id(challenge.id),
            'title': challenge.title,
            'description': challenge.description,
            'category': challenge.category,
            'difficulty': challenge.difficulty,
            'points': challenge.points,
            'author': challenge.author.username if challenge.author else 'Unknown',
            'is_solved': challenge.id in solved_ids,
            'is_personally_solved': is_personally_solved,
            'solves_count': solves_count,
            'first_blood': fb_data,
            'url': challenge.url if hasattr(challenge, 'url') else None,
            'flag_format': challenge.flag_format if hasattr(challenge, 'flag_format') else 'Hack!tUp{...}',
            'files': [{'name': f.file.name.split('/')[-1], 'url': f.file.url} for f in challenge.attachments.all()],
            'hints': []
        })

        # Process hints
        for hint in challenge.hints.all():
            if is_team_mode and user_team:
                from teams.models import TeamHint
                # Hints are now only unlocked if explicitly purchased
                is_unlocked = TeamHint.objects.filter(team=user_team, hint=hint).exists()
            else:
                is_unlocked = UserHint.objects.filter(user=request.user, hint=hint).exists()
                
            challenges_data[-1]['hints'].append({
                'id': encode_id(hint.id),
                'cost': hint.cost,
                'content': hint.content if is_unlocked else None,
                'is_unlocked': is_unlocked
            })

    return JsonResponse({
        'event': event.event_name, 
        'status': event.get_current_status(),
        'is_banned': is_banned,
        'accepting_writeups': event.accepting_writeups,
        'is_team_mode': is_team_mode,
        'needs_team': False,
        'challenges': challenges_data if not is_banned else []
    })

@login_required
@require_POST
def unlock_hint_api(request, hint_id):
    hint = get_object_or_404(ChallengeHint, id=hint_id)
    challenge = hint.challenge
    event = challenge.event
    current_status = event.get_current_status()

    access = EventAccess.objects.filter(user=request.user, event=event).first()
    # Priveleged users: verified admins (needs TOTP verified session)
    is_privileged_admin = is_admin(request, event_id=event.id)
    
    # 🎯 ARENA RULE: No one (not even superusers) gets free hints in a LIVE Arena.
    # Cost bypass only works in "Test Challenges" (Upcoming/Paused/Pending).
    can_bypass_cost = is_privileged_admin and current_status != 'live'

    if not is_privileged_admin:
        if not access or not access.is_registered or access.is_banned:
            return JsonResponse({'error': 'Access denied'}, status=403)
            
        if current_status != 'live':
            return JsonResponse({'error': f'Event is currently {current_status}. Hint unlocks are closed.'}, status=403)

    if event.is_team_mode:
        from teams.models import TeamMember, TeamHint, Team
        membership = TeamMember.objects.filter(user=request.user, team__event=event).first()
        if not membership and not is_privileged_admin:
            return JsonResponse({'error': 'You are not in a team.'}, status=403)
            
        if membership:
            from django.db import transaction
            with transaction.atomic():
                team = Team.objects.select_for_update().get(id=membership.team.id)
                if TeamHint.objects.filter(team=team, hint=hint).exists():
                    return JsonResponse({'success': True, 'hint_content': hint.content})
                    
                current_points = team.total_points
                if not can_bypass_cost and current_points < hint.cost:
                    return JsonResponse({'error': f'Not enough team points. Required: {hint.cost}, Available: {current_points}'}, status=400)
                    
                TeamHint.objects.create(team=team, hint=hint, unlocked_by=request.user)
                return JsonResponse({'success': True, 'hint_content': hint.content})
    else:
        from django.db import transaction
        with transaction.atomic():
            from django.contrib.auth import get_user_model
            user = get_user_model().objects.select_for_update().get(id=request.user.id)
            if UserHint.objects.filter(user=user, hint=hint).exists():
                 return JsonResponse({'success': True, 'hint_content': hint.content})
                 
            from django.db import models
            user_solves = UserChallenge.objects.filter(user=user, challenge__event=event, is_correct=True).aggregate(total=models.Sum('challenge__points'))['total'] or 0
            user_hints = UserHint.objects.filter(user=user, hint__challenge__event=event).aggregate(total=models.Sum('hint__cost'))['total'] or 0
            current_points = user_solves - user_hints
            
            if not can_bypass_cost and current_points < hint.cost:
                return JsonResponse({'error': f'Not enough points. Required: {hint.cost}, Available: {max(0, current_points)}'}, status=400)
                
            UserHint.objects.create(user=user, hint=hint)
            return JsonResponse({'success': True, 'hint_content': hint.content})

    return JsonResponse({'error': 'Failed to unlock hint.'}, status=400)

@ratelimit(key='user_or_ip', rate='10/m', block=False)
@login_required
@require_POST
def submit_flag_api(request, challenge_id):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'You are going too fast. Try after 1 minute.'}, status=429)
    try:
        data = json.loads(request.body)
        submitted_flag = data.get('flag', '').strip()
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    challenge = get_object_or_404(Challenge, id=challenge_id)
    event = challenge.event
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    
    is_privileged_admin = is_admin(request, event_id=event.id)

    if not is_privileged_admin:
        if not access or not access.is_registered or access.is_banned:
            return JsonResponse({'error': 'Access denied'}, status=403)
    elif access and access.is_banned:
        return JsonResponse({'error': 'Access denied (banned)'}, status=403)
        
    current_status = event.get_current_status()
    if current_status != 'live':
        return JsonResponse({'error': f'Event is currently {current_status}. Submissions are closed.'}, status=403)

    if challenge.wave and not challenge.wave.is_active:
        return JsonResponse({'error': 'Challenge locked. It belongs to an inactive wave.'}, status=403)

    # ── Team mode: check if challenge already solved by team ──────────
    if event.is_team_mode:
        from teams.models import TeamMember, TeamChallenge
        membership = TeamMember.objects.filter(user=request.user, team__event=event).first()
        if membership:
            team_already_solved = TeamChallenge.objects.filter(
                team=membership.team, challenge=challenge
            ).exists()
            if team_already_solved:
                return JsonResponse({'success': False, 'message': 'Your team has already solved this challenge'})

    # Check if already solved (individual, for non-team or fallback)
    already_solved = UserChallenge.objects.filter(
        user=request.user, 
        challenge=challenge, 
        is_correct=True
    ).exists()

    if already_solved and current_status != 'completed':
        return JsonResponse({'success': False, 'message': 'Already solved'})
        
    # Create valid submission record even if wrong (for logs)
    user_submission = UserChallenge.objects.create(
        user=request.user,
        challenge=challenge,
        submitted_flag=submitted_flag[:50],
        is_correct=False
    )
    
    is_correct = check_password(submitted_flag, challenge.flag)
    
    if is_correct:
        # Update submission to be correct
        user_submission.is_correct = True
        user_submission.save()

        # ── Team mode: credit solve to the team ───────────────────────
        if event.is_team_mode:
            from teams.models import TeamMember, TeamChallenge
            membership = TeamMember.objects.filter(user=request.user, team__event=event).first()
            if membership:
                TeamChallenge.objects.get_or_create(
                    team=membership.team,
                    challenge=challenge,
                    defaults={'solved_by': request.user}
                )
        
        if event.status == 'ended':
             return JsonResponse({'success': True, 'message': 'Correct (Practice Mode)', 'points': 0})
        
        return JsonResponse({'success': True, 'message': 'Flag Correct!', 'points': challenge.points})
    else:
        return JsonResponse({'success': False, 'message': 'Incorrect Flag'})

@login_required
@require_GET
def event_leaderboard_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    User = get_user_model()

    # ── TEAM MODE LEADERBOARD ────────────────────────────────────────
    if event.is_team_mode:
        from teams.models import Team, TeamChallenge, TeamMember

        teams = Team.objects.filter(event=event).prefetch_related(
            'members__user', 'solves__challenge'
        )

        event_challenges = Challenge.objects.filter(event=event)
        event_total_challenges = event_challenges.count()
        event_total_points = event_challenges.aggregate(total=models.Sum('points'))['total'] or 0

        # Build event start datetime
        if event.start_date and event.start_time:
            start_dt = datetime.combine(event.start_date, event.start_time)
            if timezone.is_naive(start_dt):
                start_dt = timezone.make_aware(start_dt)
            event_start_iso = start_dt.isoformat()
        else:
            start_dt = timezone.now() - timezone.timedelta(hours=1)
            event_start_iso = start_dt.isoformat()

        team_list = []
        user_team_id = None

        # Find the current user's team
        user_membership = TeamMember.objects.filter(user=request.user, team__event=event).first()
        if user_membership:
            user_team_id = user_membership.team_id

        for team in teams:
            timeline_events = []
            
            for solve in team.solves.all():
                timeline_events.append({
                    'type': 'solve',
                    'name': solve.challenge.title,
                    'delta': solve.challenge.points,
                    'timestamp': solve.solved_at,
                    'id': encode_id(solve.id)
                })
                
            # Get Team hints
            team_hints = team.hints_unlocked.select_related('hint', 'hint__challenge')
            for th in team_hints:
                timeline_events.append({
                    'type': 'hint',
                    'name': f"Hint: {th.hint.challenge.title}",
                    'delta': -th.hint.cost,
                    'timestamp': th.unlocked_at,
                    'id': f"hint-{th.id}"
                })
                
            timeline_events.sort(key=lambda x: x['timestamp'])
            
            current_score = 0
            current_flags = 0
            last_solve_time = None
            
            history = [{
                'flagName': 'Event Start', 'points': 0, 'total': 0,
                'timestamp': 'Start', 'rawTime': event_start_iso, 'id': 'start'
            }]

            for evt in timeline_events:
                current_score += evt['delta']
                    
                if evt['type'] == 'solve':
                    current_flags += 1
                    last_solve_time = evt['timestamp']
                    
                history.append({
                    'flagName': evt['name'],
                    'points': evt['delta'],
                    'total': current_score,
                    'timestamp': evt['timestamp'].strftime('%H:%M'),
                    'rawTime': evt['timestamp'].isoformat(),
                    'id': evt['id']
                })

            history.append({
                'flagName': 'Current', 'points': 0, 'total': current_score,
                'timestamp': 'Now', 'rawTime': timezone.now().isoformat(), 'id': 'now'
            })

            team_list.append({
                'id': encode_id(team.id),
                'name': team.name,
                'captain': team.captain.username,
                'members': [m.user.username for m in team.members.all()],
                'member_count': team.members.count(),
                'points': current_score,
                'flags': current_flags,
                'last_solve_time': last_solve_time,
                'history': history,
                'avatar': f'https://ui-avatars.com/api/?name={team.name}&background=random&color=fff',
                'is_my_team': team.id == user_team_id,
            })

        # Sort: points desc, last solve asc
        team_list.sort(key=lambda t: (
            -t['points'],
            t['last_solve_time'] if t['last_solve_time'] else timezone.now()
        ))

        current_team_stats = None
        for idx, team in enumerate(team_list):
            team['rank'] = idx + 1
            team['totalFlags'] = event_total_challenges
            team['progress'] = (team['flags'] / event_total_challenges * 100) if event_total_challenges else 0
            team['color'] = f"hsl({(idx * 137.5) % 360}, 85%, 60%)"
            if team['is_my_team']:
                current_team_stats = team

        if not current_team_stats and user_team_id is None:
            current_team_stats = {
                'name': 'No Team',
                'rank': '-', 'points': 0, 'flags': 0,
                'totalFlags': event_total_challenges,
            }

        return JsonResponse({
            'is_team_mode': True,
            'leaderboard': team_list,
            'event': event.event_name,
            'event_total_points': event_total_points,
            'event_total_challenges': event_total_challenges,
            'current_team_stats': current_team_stats,
        })

    # ── INDIVIDUAL MODE LEADERBOARD (unchanged) ──────────────────────
    submissions = UserChallenge.objects.filter(
        challenge__event=event,
        is_correct=True
    ).select_related('user', 'challenge').order_by('submitted_at')

    unlocked_hints = UserHint.objects.filter(
        hint__challenge__event=event
    ).select_related('user', 'hint')
    
    registered_users = EventAccess.objects.filter(event=event).select_related('user')

    leaderboard_data = {}
    
    def get_or_init_user(uid, username):
        if uid not in leaderboard_data:
            leaderboard_data[uid] = {
                'id': encode_id(uid),
                'username': username,
                'team': 'Hack!t',
                'points': 0,
                'flags': 0,
                'last_solve_time': None,
                'history': [],
                'timeline_events': [],
                'avatar': f'https://ui-avatars.com/api/?name={username}&background=random&color=fff'
            }
        return leaderboard_data[uid]

    for access in registered_users:
        get_or_init_user(access.user.id, access.user.username)

    processed_solves = set()
    for sub in submissions:
        uid = sub.user.id
        if (uid, sub.challenge.id) in processed_solves:
            continue
        processed_solves.add((uid, sub.challenge.id))

        user_data = get_or_init_user(uid, sub.user.username)
        user_data['timeline_events'].append({
            'type': 'solve',
            'name': sub.challenge.title,
            'delta': sub.challenge.points,
            'timestamp': sub.submitted_at,
            'id': encode_id(sub.id)
        })

    for uh in unlocked_hints:
        uid = uh.user.id
        user_data = get_or_init_user(uid, uh.user.username)
        user_data['timeline_events'].append({
            'type': 'hint',
            'name': f"Hint: {uh.hint.challenge.title}",
            'delta': -uh.hint.cost,
            'timestamp': uh.unlocked_at,
            'id': f"hint-{uh.id}"
        })

    if event.start_date and event.start_time:
        start_dt = datetime.combine(event.start_date, event.start_time)
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        event_start_iso = start_dt.isoformat()
    else:
        start_dt = timezone.now() - timezone.timedelta(hours=1)
        event_start_iso = start_dt.isoformat()

    for uid, data in leaderboard_data.items():
        data['timeline_events'].sort(key=lambda x: x['timestamp'])
        
        current_score = 0
        current_flags = 0
        last_solve = None

        data['history'].append({
            'flagName': 'Event Start', 'points': 0, 'total': 0,
            'timestamp': 'Start', 'rawTime': event_start_iso, 'id': 'start'
        })

        for evt in data['timeline_events']:
            current_score += evt['delta']
            if evt['type'] == 'solve':
                current_flags += 1
                last_solve = evt['timestamp']
            data['history'].append({
                'flagName': evt['name'],
                'points': evt['delta'],
                'total': current_score,
                'timestamp': evt['timestamp'].strftime('%H:%M'),
                'rawTime': evt['timestamp'].isoformat(),
                'id': evt['id']
            })

        data['points'] = current_score
        data['flags'] = current_flags
        data['last_solve_time'] = last_solve

        data['history'].append({
            'flagName': 'Current', 'points': 0, 'total': current_score,
            'timestamp': 'Now', 'rawTime': timezone.now().isoformat(), 'id': 'now'
        })
        del data['timeline_events']

    sorted_users = sorted(
        leaderboard_data.values(),
        key=lambda x: (-x['points'], x['last_solve_time'] if x['last_solve_time'] else timezone.now())
    )

    current_user_stats = None
    
    for index, user in enumerate(sorted_users):
        user['rank'] = index + 1
        user['maxPoints'] = 15000
        user['totalFlags'] = Challenge.objects.filter(event=event).count()
        user['progress'] = (user['flags'] / user['totalFlags']) * 100 if user['totalFlags'] > 0 else 0
        user['color'] = f"hsl({(index * 137.5) % 360}, 85%, 60%)"
        
        if user['id'] == encode_id(request.user.id):
            user['is_me'] = True
            current_user_stats = user
        else:
            user['is_me'] = False

    if not current_user_stats:
        current_user_stats = {
            'id': encode_id(request.user.id),
            'username': request.user.username,
            'rank': '-', 'points': 0, 'flags': 0,
            'totalFlags': Challenge.objects.filter(event=event).count(),
            'avatar': f'https://ui-avatars.com/api/?name={request.user.username}&background=random&color=fff'
        }

    event_challenges = Challenge.objects.filter(event=event)
    event_total_challenges = event_challenges.count()
    event_total_points = event_challenges.aggregate(total=models.Sum('points'))['total'] or 0

    return JsonResponse({
        'is_team_mode': False,
        'leaderboard': sorted_users,
        'event': event.event_name,
        'event_total_points': event_total_points,
        'event_total_challenges': event_total_challenges,
        'current_user_stats': current_user_stats
    })


@require_GET
@login_required
def event_announcements_api(request, event_id):
    """
    Returns the chronologically ordered announcements for a given event.
    Only allows access if the user is registered for the event.
    """
    event = get_object_or_404(Event, id=event_id)
    
    # Check access
    try:
        access = EventAccess.objects.get(user=request.user, event=event)
        if not access.is_registered or access.is_banned:
            return JsonResponse({"error": "Forbidden: Not registered or banned"}, status=403)
    except EventAccess.DoesNotExist:
        # Admins also shouldn't be blocked from seeing this if checking UI
        if not request.user.is_staff and not getattr(request.user, 'is_superuser', False):
            return JsonResponse({"error": "Forbidden: No event access"}, status=403)
            
    try:
        announcements = __import__('challenges.models', fromlist=['Announcement']).Announcement.objects.filter(event=event).order_by('-created_at')
        
        data = []
        for ann in announcements:
            data.append({
                'id': encode_id(ann.id),
                'title': ann.title,
                'content': ann.content,
                'type': ann.type,
                'author': ann.created_by.username if ann.created_by else 'System',
                'created_at': ann.created_at.isoformat()
            })
            
        return JsonResponse({"success": True, "announcements": data})
        
    except Exception:
        logger.exception("Unexpected error in event_announcements_api for event %s", event_id)
        return JsonResponse({"error": "An internal error occurred."}, status=500)


@login_required
@require_GET
def challenge_solvers_api(request, challenge_id):
    from ctf.utils import decode_id
    from datetime import datetime
    
    challenge = get_object_or_404(Challenge, id=challenge_id)
    event = challenge.event
    
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    if not access or not access.is_registered or access.is_banned:
        return JsonResponse({'error': 'Access denied'}, status=403)
        
    if challenge.wave and not challenge.wave.is_active:
        return JsonResponse({'error': 'Access denied: Challenge wave is not active.'}, status=403)
        
    solvers_data = []
    
    if event.is_team_mode:
        from teams.models import TeamChallenge
        solves = TeamChallenge.objects.filter(challenge=challenge).select_related('team').order_by('solved_at')
        for solve in solves:
            solvers_data.append({
                'name': solve.team.name,
                'time': solve.solved_at.isoformat() if solve.solved_at else None
            })
    else:
        solves = UserChallenge.objects.filter(challenge=challenge, is_correct=True).select_related('user').order_by('submitted_at')
        for solve in solves:
            solvers_data.append({
                'name': solve.user.username,
                'time': solve.submitted_at.isoformat() if solve.submitted_at else None
            })
            
    return JsonResponse({'solvers': solvers_data})
