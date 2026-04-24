import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ctf.settings')
django.setup()

from django.contrib.auth import get_user_model
from challenges.models import Challenge, UserChallenge
from teams.models import Team, TeamMember, TeamChallenge
from administration.models import Event
from challenges.services import get_leaderboard_data

User = get_user_model()
event = Event.objects.filter(is_team_mode=True).first()
if not event:
    event = Event.objects.first()
    event.is_team_mode = True
    event.save()
    
user = User.objects.first()
team, _ = Team.objects.get_or_create(event=event, name="TestTeam", captain=user)
TeamMember.objects.get_or_create(user=user, team=team)
challenge = Challenge.objects.filter(event=event).first()

print(f"Team Mode Event: {event.is_team_mode}")
# Get current leaderboard
payload = get_leaderboard_data(event.id)
print("Points before:", next((t['points'] for t in payload['leaderboard'] if t['name'] == team.name), 0) if payload else 0)

# Simulate UserChallenge correct
user_submission = UserChallenge.objects.create(
    user=user, challenge=challenge, submitted_flag="wrong", is_correct=False
)
user_submission.is_correct = True
user_submission.save()

# Check cache after UserChallenge
payload = get_leaderboard_data(event.id)
points_after_uc = next((t['points'] for t in payload['leaderboard'] if t['name'] == team.name), 0)
print("Points after UserChallenge:", points_after_uc)

# Simulate TeamChallenge creation
tc, _ = TeamChallenge.objects.get_or_create(team=team, challenge=challenge, defaults={'solved_by': user})

# Check cache after TeamChallenge
payload = get_leaderboard_data(event.id)
points_after_tc = next((t['points'] for t in payload['leaderboard'] if t['name'] == team.name), 0)
print("Points after TeamChallenge:", points_after_tc)

# Cleanup
tc.delete()
user_submission.delete()
team.delete()
