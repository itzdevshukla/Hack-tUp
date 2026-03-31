import json
import os
import traceback
from datetime import datetime, date, time
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Announcement, UserChallenge, UserHint, Challenge
from dashboard.models import EventAccess
from ctf.utils import encode_id

def emit_ws_event(event_type, data):
    event_file = os.path.join(settings.BASE_DIR, 'ws_events.log')
    try:
        with open(event_file, 'a') as f:
            f.write(json.dumps({'type': event_type, 'data': data}) + '\n')
    except Exception as e:
        print(f"Failed to IPC emit: {e}")

def build_leaderboard_payload(event):
    """Build a lightweight leaderboard payload for the event (supports both individual and team mode)."""
    try:
        if event.is_team_mode:
            # ── TEAM MODE LEADERBOARD ─────────────────────────────────────
            from teams.models import Team, TeamChallenge, TeamHint
            
            teams = Team.objects.filter(event=event).select_related('event')
            all_team_ids = [t.id for t in teams]
            
            team_solves = TeamChallenge.objects.filter(team_id__in=all_team_ids).select_related('team', 'challenge')
            team_hints = TeamHint.objects.filter(team_id__in=all_team_ids).select_related('team', 'hint')
            
            leaderboard_data = {}
            
            def get_or_init_team(tid, name):
                if tid not in leaderboard_data:
                    leaderboard_data[tid] = {
                        'id': encode_id(tid),
                        'name': name,
                        'points': 0, 'flags': 0,
                        'last_solve_time': None,
                        'history': [], 'timeline': [],
                        'avatar': f'https://ui-avatars.com/api/?name={name}&background=random&color=fff',
                    }
                return leaderboard_data[tid]

            for t in teams:
                get_or_init_team(t.id, t.name)

            for solve in team_solves:
                td = get_or_init_team(solve.team.id, solve.team.name)
                td['timeline'].append({
                    'type': 'solve', 'name': solve.challenge.title,
                    'delta': solve.challenge.points, 'timestamp': solve.solved_at,
                    'id': encode_id(solve.id)
                })

            for hint in team_hints:
                td = get_or_init_team(hint.team.id, hint.team.name)
                td['timeline'].append({
                    'type': 'hint', 'name': f"Hint: {hint.hint.challenge.title}",
                    'delta': -hint.hint.cost, 'timestamp': hint.unlocked_at,
                    'id': f"hint-{hint.id}"
                })

            total_challenges = Challenge.objects.filter(event=event).count()
            total_points = Challenge.objects.filter(event=event).aggregate(total=Sum('points'))['total'] or 0
            
            # Safe date/time handling
            if event.start_date and event.start_time:
                start_dt = datetime.combine(event.start_date, event.start_time)
                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt)
                event_start_iso = start_dt.isoformat()
            else:
                event_start_iso = (timezone.now() - timezone.timedelta(hours=1)).isoformat()

            for tid, data in leaderboard_data.items():
                data['timeline'].sort(key=lambda x: x['timestamp'])
                current_score = 0
                current_flags = 0
                last_solve_iso = None
                data['history'].append({'flagName': 'Start', 'points': 0, 'total': 0, 'rawTime': event_start_iso, 'id': 'start'})
                
                for evt in data['timeline']:
                    current_score += evt['delta']
                    if current_score < 0: current_score = 0
                    if evt['type'] == 'solve':
                        current_flags += 1
                        last_solve_iso = evt['timestamp'].isoformat()
                    
                    data['history'].append({
                        'flagName': evt['name'], 'points': evt['delta'], 'total': current_score,
                        'timestamp': evt['timestamp'].strftime('%H:%M'), 'rawTime': evt['timestamp'].isoformat(),
                        'id': evt['id']
                    })
                
                data['points'] = current_score
                data['flags'] = current_flags
                data['last_solve_time'] = last_solve_iso
                data['history'].append({'flagName': 'Current', 'points': 0, 'total': current_score, 'rawTime': timezone.now().isoformat(), 'id': 'now'})
                del data['timeline']

            sorted_teams = sorted(leaderboard_data.values(), key=lambda x: (-x['points'], x['last_solve_time'] or ''))
            for index, t in enumerate(sorted_teams):
                t['rank'] = index + 1
                t['progress'] = (t['flags'] / total_challenges * 100) if total_challenges else 0
                t['color'] = f"hsl({(index * 137.5) % 360}, 85%, 60%)"

            return {
                'is_team_mode': True,
                'leaderboard': sorted_teams,
                'event': event.event_name,
                'event_total_points': total_points,
                'event_total_challenges': total_challenges,
            }

        else:
            # ── INDIVIDUAL MODE LEADERBOARD ────────────────────────────────
            submissions = UserChallenge.objects.filter(
                challenge__event=event, is_correct=True
            ).select_related('user', 'challenge').order_by('submitted_at')

            unlocked_hints = UserHint.objects.filter(
                hint__challenge__event=event
            ).select_related('user', 'hint')

            registered_users = EventAccess.objects.filter(event=event).select_related('user')

            leaderboard_data = {}

            def get_or_init(uid, username):
                if uid not in leaderboard_data:
                    leaderboard_data[uid] = {
                        'id': encode_id(uid),
                        'username': username,
                        'team': 'Hack!t',
                        'points': 0, 'flags': 0,
                        'last_solve_time': None,
                        'history': [], 'timeline_events': [],
                        'avatar': f'https://ui-avatars.com/api/?name={username}&background=random&color=fff',
                        'is_me': False,
                    }
                return leaderboard_data[uid]

            for access in registered_users:
                get_or_init(access.user.id, access.user.username)

            processed = set()
            for sub in submissions:
                uid = sub.user.id
                if (uid, sub.challenge.id) in processed:
                    continue
                processed.add((uid, sub.challenge.id))
                get_or_init(uid, sub.user.username)['timeline_events'].append({
                    'type': 'solve', 'name': sub.challenge.title,
                    'delta': sub.challenge.points,
                    'timestamp': sub.submitted_at,
                    'timestamp_iso': sub.submitted_at.isoformat(),
                    'timestamp_hm': sub.submitted_at.strftime('%H:%M'),
                    'id': encode_id(sub.id)
                })

            for uh in unlocked_hints:
                get_or_init(uh.user.id, uh.user.username)['timeline_events'].append({
                    'type': 'hint', 'name': f"Hint: {uh.hint.challenge.title}",
                    'delta': -uh.hint.cost,
                    'timestamp': uh.unlocked_at,
                    'timestamp_iso': uh.unlocked_at.isoformat(),
                    'timestamp_hm': uh.unlocked_at.strftime('%H:%M'),
                    'id': f"hint-{uh.id}"
                })

            if event.start_date and event.start_time:
                start_dt = datetime.combine(event.start_date, event.start_time)
                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt)
                event_start_iso = start_dt.isoformat()
            else:
                event_start_iso = (timezone.now() - timezone.timedelta(hours=1)).isoformat()

            total_challenges = Challenge.objects.filter(event=event).count()
            total_points = Challenge.objects.filter(event=event).aggregate(total=Sum('points'))['total'] or 0

            for uid, data in leaderboard_data.items():
                data['timeline_events'].sort(key=lambda x: x['timestamp'])
                current_score = 0
                current_flags = 0
                last_solve_iso = None
                data['history'].append({
                    'flagName': 'Event Start', 'points': 0, 'total': 0,
                    'timestamp': 'Start', 'rawTime': event_start_iso, 'id': 'start'
                })
                for evt in data['timeline_events']:
                    current_score += evt['delta']
                    if current_score < 0:
                        current_score = 0
                    if evt['type'] == 'solve':
                        current_flags += 1
                        last_solve_iso = evt['timestamp_iso']
                    data['history'].append({
                        'flagName': evt['name'], 'points': evt['delta'],
                        'total': current_score,
                        'timestamp': evt['timestamp_hm'],
                        'rawTime': evt['timestamp_iso'],
                        'id': evt['id']
                    })
                data['points'] = current_score
                data['flags'] = current_flags
                data['last_solve_time'] = last_solve_iso
                data['history'].append({
                    'flagName': 'Current', 'points': 0, 'total': current_score,
                    'timestamp': 'Now', 'rawTime': timezone.now().isoformat(), 'id': 'now'
                })
                del data['timeline_events']

            sorted_users = sorted(
                leaderboard_data.values(),
                key=lambda x: (-x['points'], x['last_solve_time'] or '')
            )

            for index, user in enumerate(sorted_users):
                user['rank'] = index + 1
                user['maxPoints'] = total_points or 15000
                user['totalFlags'] = total_challenges
                user['progress'] = (user['flags'] / total_challenges * 100) if total_challenges else 0
                user['color'] = f"hsl({(index * 137.5) % 360}, 85%, 60%)"

            return {
                'is_team_mode': False,
                'leaderboard': sorted_users,
                'event': event.event_name,
                'event_total_points': total_points,
                'event_total_challenges': total_challenges,
            }
    except Exception:
        # Standard error log for debug
        with open('ws_error.log', 'a') as f:
            f.write(f"\n--- ERROR AT {timezone.now()} ---\n")
            f.write(traceback.format_exc())
        return None

@receiver(post_save, sender=Announcement)
def announcement_saved(sender, instance, created, **kwargs):
    if created:
        emit_ws_event("new_announcement", {
            "id": instance.id,
            "title": instance.title,
            "content": instance.content,
            "type": instance.type,
            "author": instance.created_by.username if instance.created_by else 'Admin',
            "created_at": instance.created_at.isoformat()
        })
    else:
        emit_ws_event("refresh_announcements", {})

@receiver(post_delete, sender=Announcement)
def announcement_deleted(sender, instance, **kwargs):
    emit_ws_event("refresh_announcements", {})

@receiver(post_save, sender=UserChallenge)
def user_challenge_saved(sender, instance, created, **kwargs):
    # Always emit a new_submission event (for admin live feed)
    try:
        from ctf.utils import encode_id
        # Try to get team info
        team_name = None
        team_id = None
        try:
            from teams.models import TeamMember
            membership = TeamMember.objects.filter(
                user=instance.user, team__event=instance.challenge.event
            ).select_related('team').first()
            if membership:
                team_name = membership.team.name
                team_id = encode_id(membership.team.id)
        except Exception:
            pass

        from django.utils import timezone
        submission_data = {
            "event_id": encode_id(instance.challenge.event_id),
            "id": encode_id(instance.id),
            "user_id": encode_id(instance.user.id),
            "username": instance.user.username,
            "challenge_id": encode_id(instance.challenge.id),
            "challenge_title": instance.challenge.title,
            "flag": instance.submitted_flag if not instance.is_correct else "CORRECT",
            "is_correct": instance.is_correct,
            "submitted_at": timezone.localtime(instance.submitted_at).strftime("%Y-%m-%d %I:%M:%S %p"),
            "team_name": team_name,
            "team_id": team_id,
        }
        emit_ws_event("new_submission", submission_data)
    except Exception as e:
        print(f"Failed to emit new_submission: {e}")

    # Emit leaderboard update only for correct submissions
    if instance.is_correct:
        try:
            payload = build_leaderboard_payload(instance.challenge.event)
            if payload:
                emit_ws_event("leaderboard_update", payload)
            else:
                 emit_ws_event("leaderboard_update", {})
        except Exception:
            with open('ws_error.log', 'a') as f:
                f.write(f"\n--- SIGNAL ERROR {timezone.now()} ---\n")
                f.write(traceback.format_exc())
            emit_ws_event("leaderboard_update", {})

@receiver(post_delete, sender=UserChallenge)
def user_challenge_deleted(sender, instance, **kwargs):
    try:
        payload = build_leaderboard_payload(instance.challenge.event)
        emit_ws_event("leaderboard_update", payload or {})
    except Exception:
        pass

@receiver(post_save, sender=UserHint)
@receiver(post_delete, sender=UserHint)
def user_hint_changed(sender, instance, **kwargs):
    try:
        # Check if hint and challenge exist
        event = instance.hint.challenge.event
        payload = build_leaderboard_payload(event)
        emit_ws_event("leaderboard_update", payload or {})
    except Exception:
        with open('ws_error.log', 'a') as f:
             f.write(traceback.format_exc())

# ── TEAM SIGNALS ──────────────────────────────────────────────────
@receiver(post_save, sender='teams.TeamChallenge')
@receiver(post_delete, sender='teams.TeamChallenge')
def team_challenge_changed(sender, instance, **kwargs):
    try:
        payload = build_leaderboard_payload(instance.challenge.event)
        emit_ws_event("leaderboard_update", payload or {})
    except Exception:
        pass

@receiver(post_save, sender='teams.TeamHint')
@receiver(post_delete, sender='teams.TeamHint')
def team_hint_changed(sender, instance, **kwargs):
    try:
        payload = build_leaderboard_payload(instance.hint.challenge.event)
        emit_ws_event("leaderboard_update", payload or {})
    except Exception:
        pass
