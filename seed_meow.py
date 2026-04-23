"""
Re-seed submissions with proper spread timestamps.
auto_now_add=True can't be overridden in create(), so we use
queryset.update() after creation to set the real submitted_at.
"""
import random
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from administration.models import Event
from challenges.models import Challenge, UserChallenge

User = get_user_model()
event = Event.objects.get(id=3)  # Meow

fake_usernames = [
    'h4ck3r_1337', 'n00b_slayer', 'cyb3rwizard', 'shellshock99',
    'zeroday_god', 'root_access', 'xss_queen', 'cryptoking',
]
fake_users = list(User.objects.filter(username__in=fake_usernames))
challenges = list(Challenge.objects.filter(event=event))

event_start = timezone.now() - timedelta(hours=3)

# Wipe existing seeded solves
deleted, _ = UserChallenge.objects.filter(
    user__in=fake_users, challenge__event=event, is_correct=True
).delete()
print(f"Deleted {deleted} old seeded solves")

print("Solve distribution (re-seeded with real timestamps):")
for user in fake_users:
    n_solves = random.randint(2, len(challenges))
    chosen = random.sample(challenges, n_solves)
    total_pts = 0

    # Spread solves across the 3-hour window with increasing offsets
    offsets = sorted(random.sample(range(5, 175), n_solves))

    for ch, offset_mins in zip(chosen, offsets):
        ts = event_start + timedelta(minutes=offset_mins)
        # Create without submitted_at (auto_now_add fires)
        uc = UserChallenge.objects.create(
            user=user,
            challenge=ch,
            submitted_flag='SEEDED_FLAG',
            is_correct=True,
        )
        # Then UPDATE directly to bypass auto_now_add
        UserChallenge.objects.filter(pk=uc.pk).update(submitted_at=ts)
        total_pts += ch.points

    print(f"  {user.username:<20} solves={n_solves}  pts={total_pts}")

# Force cache invalidation so leaderboard rebuilds fresh
from challenges.services import invalidate_leaderboard_cache
invalidate_leaderboard_cache(event.id)
print(f"\nCache invalidated for event {event.id}.")
print("Done! Refresh the leaderboard page.")
