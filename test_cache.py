import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ctf.settings')
django.setup()

from django.contrib.auth import get_user_model
from challenges.models import Challenge, UserChallenge
from administration.models import Event
from challenges.services import get_leaderboard_data, update_leaderboard_cache

User = get_user_model()
user = User.objects.first()
event = Event.objects.first()
challenge = Challenge.objects.filter(event=event).first()

print(f"User: {user}, Event: {event}, Challenge: {challenge}")

# Get current leaderboard
payload = get_leaderboard_data(event.id)
print("Current leaderboard cache:", payload is not None)

# Simulate submission
user_submission = UserChallenge.objects.create(
    user=user,
    challenge=challenge,
    submitted_flag="wrong",
    is_correct=False
)
print("Created wrong submission")

user_submission.is_correct = True
user_submission.save()
print("Updated to correct")

# Check if cache was updated
new_payload = get_leaderboard_data(event.id)
if new_payload:
    print("New payload found. Checking points...")
    for entry in new_payload['leaderboard']:
        if entry.get('username') == user.username or entry.get('name') == getattr(user, 'username', ''):
            print(f"Points for {user.username}: {entry['points']}")
            break

# Cleanup
user_submission.delete()
