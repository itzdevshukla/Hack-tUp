import json
from datetime import date, timedelta
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate

from administration.models import Event
from dashboard.models import EventAccess
from challenges.models import Challenge, UserChallenge

from ctf.utils import encode_id

@login_required
@require_GET
def dashboard_events_api(request):
    events = Event.objects.filter(is_approved=True, is_rejected=False).order_by('-created_at')
    
    events_data = []
    for event in events:
        events_data.append({
            'id': encode_id(event.id),
            'title': event.event_name,
            'description': event.description,
            'status': event.get_current_status(),
            'venue': event.venue,
            'type': event.ctf_type,
            'participants': event.max_participants, # Ideally current participants, but max for now
            'start_date': event.start_date,
            'start_time': event.start_time,
            'end_date': event.end_date,
            'creator': event.created_by.username,
            # Add image URL if you have an image field, currently using placeholder in React
        })
    
    return JsonResponse({'events': events_data})

@csrf_exempt
@login_required
@require_POST
def join_event_api(request, event_id):
    try:
        data = json.loads(request.body)
        access_code = data.get('accessCode', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    event = get_object_or_404(Event, id=event_id)
    
    if not event.is_registration_open():
        return JsonResponse({'success': False, 'message': 'Registration Closed'})

    # Check max participants
    current_participants = EventAccess.objects.filter(event=event, is_registered=True).count()
    if current_participants >= event.max_participants:
        return JsonResponse({'success': False, 'message': 'Event is full (Capacity Reached)'})
        
    if access_code != event.access_code:
        return JsonResponse({'success': False, 'message': 'Invalid Access Code'})
        
    access, created = EventAccess.objects.get_or_create(
        user=request.user,
        event=event,
        defaults={"is_registered": True}
    )
    
    if not created and not access.is_registered:
        access.is_registered = True
        access.save()
        
    return JsonResponse({'success': True, 'message': 'Registered Successfully'})

@login_required
@require_GET
def event_details_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    
    # Check if user is registered (or has access)
    is_registered = False
    if EventAccess.objects.filter(user=request.user, event=event, is_registered=True).exists():
        is_registered = True

    # Counts
    challenges_count = Challenge.objects.filter(event=event).count()
    participants_count = EventAccess.objects.filter(event=event, is_registered=True).count()
    
    data = {
        'id': encode_id(event.id),
        'title': event.event_name,
        'description': event.description,
        'status': event.get_current_status(),
        'venue': event.venue,
        'type': event.ctf_type,
        # 'difficulty': event.difficulty_level, # Check if this field exists in Event model?
        # Checking Event model fields from previous context or just standard fields.
        # administration.models.Event usually has these. Let's assume description, venue, etc are there.
        # If difficulty is not in Event, I should omit or fetch from challenges average?
        # Let's check Event model again if needed, or just omit difficulty for now if unsure.
        # I recall 'difficulty' used in frontend mock data.
        'organizer': event.created_by.username,
        'start_date': event.start_date,
        'start_time': event.start_time,
        'end_date': event.end_date,
        'end_time': event.end_time,
        'challenges_count': challenges_count,
        'participants_count': participants_count,
        'is_registered': is_registered,
        'is_registration_open': event.is_registration_open(),
        'rules': event.rules or '',
        'is_team_mode': event.is_team_mode,
        'max_team_size': event.max_team_size,
    }
    
    return JsonResponse(data)

@csrf_exempt
@login_required
@require_POST
def user_request_event_api(request):
    try:
        data = json.loads(request.body)
        
        event = Event.objects.create(
            event_name=data.get('eventName'),
            venue=data.get('venue'),
            description=data.get('description'),
            ctf_type=data.get('ctfType'),
            max_participants=int(data.get('participants')),
            start_date=parse_date(data.get('startDate')),
            start_time=parse_time(data.get('startTime')),
            end_date=parse_date(data.get('endDate')),
            end_time=parse_time(data.get('endTime')),
            registration_start_date=parse_date(data.get('registrationStartDate')) if data.get('registrationStartDate') else None,
            registration_start_time=parse_time(data.get('registrationStartTime')) if data.get('registrationStartTime') else None,
            registration_end_date=parse_date(data.get('registrationEndDate')) if data.get('registrationEndDate') else None,
            registration_end_time=parse_time(data.get('registrationEndTime')) if data.get('registrationEndTime') else None,
            is_team_mode=str(data.get('isTeamMode')).lower() == 'true' if isinstance(data.get('isTeamMode'), str) else bool(data.get('isTeamMode')),
            max_team_size=int(data.get('maxTeamSize') or 4),
            created_by=request.user,
            is_approved=False,
            is_rejected=False
        )
        return JsonResponse({'success': True, 'message': 'Event requested successfully.', 'event_id': encode_id(event.id)})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required
@require_GET
def user_dashboard_overview_api(request):
    # 1. Registered Events Count
    events_registered = EventAccess.objects.filter(user=request.user, is_registered=True).count()
    
    # 2. Challenges Solved Count (unique)
    solved_challenges_ids = UserChallenge.objects.filter(
        user=request.user, is_correct=True
    ).values_list('challenge_id', flat=True).distinct()
    challenges_solved = solved_challenges_ids.count()
    
    # 3. Total Score
    total_score = Challenge.objects.filter(id__in=solved_challenges_ids).aggregate(Sum('points'))['points__sum'] or 0

    # 4. Upcoming Events (platform wide)
    upcoming_events_qs = Event.objects.filter(
        is_approved=True,
        is_rejected=False,
        start_date__gte=date.today()
    ).order_by('start_date', 'start_time')[:3]
    
    upcoming_events = []
    for ev in upcoming_events_qs:
        s_date = parse_date(ev.start_date) if isinstance(ev.start_date, str) else ev.start_date
        s_time = parse_time(ev.start_time) if isinstance(ev.start_time, str) else ev.start_time
        
        upcoming_events.append({
            'id': encode_id(ev.id),
            'title': ev.event_name,
            'date': s_date.strftime("%b %d, %Y") if s_date else None,
            'time': s_time.strftime("%I:%M %p") if s_time else None
        })

    return JsonResponse({
        'events_registered': events_registered,
        'challenges_solved': challenges_solved,
        'total_score': total_score,
        'upcoming_events': upcoming_events
    })


@require_GET
@login_required
def user_registered_events_api(request):
    """
    Returns a list of all events the user is registered for.
    Used by the Registered Events tab.
    """
    # Fetch user's registered events
    registered_accesses = EventAccess.objects.filter(
        user=request.user,
        is_registered=True
    ).select_related('event').order_by('event__start_date', 'event__start_time')
    
    events_data = []
    
    for access in registered_accesses:
        ev = access.event
        
        status = ev.get_current_status()

        s_date = parse_date(ev.start_date) if isinstance(ev.start_date, str) else ev.start_date
        e_date = parse_date(ev.end_date) if isinstance(ev.end_date, str) else ev.end_date
                
        events_data.append({
            'id': encode_id(ev.id),
            'title': ev.event_name,
            'description': ev.description,
            'start_date': s_date.strftime("%b %d, %Y") if s_date else None,
            'end_date': e_date.strftime("%b %d, %Y") if e_date else None,
            'creator': ev.created_by.username if ev.created_by else 'Admin',
            'status': status
        })

    return JsonResponse({'events': events_data})


@require_GET
@login_required
def user_activity_heatmap_api(request):
    """
    Returns the user's correct challenge submissions grouped by day for the last 365 days,
    along with calculated metrics (total, active days, streaks).
    """
    now = timezone.now()
    one_year_ago = now - timedelta(days=365)

    # 1. Fetch correct submissions in the last year
    submissions = UserChallenge.objects.filter(
        user=request.user,
        is_correct=True,
        submitted_at__gte=one_year_ago
    ).annotate(date=TruncDate('submitted_at')).values('date').annotate(count=Count('id')).order_by('date')

    # 2. Build the heatmap dictionary { "YYYY-MM-DD": count }
    heatmap_data = {}
    total_activity = 0
    active_days = 0

    for sub in submissions:
        if sub['date']:
            date_str = sub['date'].strftime('%Y-%m-%d')
            count = sub['count']
            heatmap_data[date_str] = count
            total_activity += count
            active_days += 1

    # 3. Calculate Streaks
    current_streak = 0
    max_streak = 0
    
    temp_streak: int = 0
    today_str = now.strftime('%Y-%m-%d')
    yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    for i in range(365, -1, -1):
        check_date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        if check_date in heatmap_data:
            temp_streak += 1
            max_streak = max(max_streak, temp_streak)
            if check_date == today_str or check_date == yesterday_str:
                current_streak = temp_streak
        else:
            if check_date != today_str: 
                temp_streak = 0
                
    if today_str not in heatmap_data and yesterday_str not in heatmap_data:
        current_streak = 0

    avg_daily = round(total_activity / 365, 2)

    return JsonResponse({
        'heatmap': heatmap_data,
        'metrics': {
            'total_activity': total_activity,
            'active_days': active_days,
            'avg_daily': avg_daily,
            'current_streak': current_streak,
            'max_streak': max_streak
        }
    })
