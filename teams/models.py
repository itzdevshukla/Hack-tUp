import secrets
import string
from django.db import models
from django.contrib.auth.models import User
from administration.models import Event


def _generate_invite_code():
    """Generate a unique 8-char alphanumeric invite code prefixed with TEAM-"""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "TEAM-" + "".join(secrets.choice(chars) for _ in range(8))
        if not Team.objects.filter(invite_code=code).exists():
            return code


class Team(models.Model):
    event       = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="teams")
    name        = models.CharField(max_length=100)
    invite_code = models.CharField(max_length=20, unique=True, blank=True)
    captain     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="captained_teams")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "name")
        ordering = ["created_at"]

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = _generate_invite_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} @ {self.event.event_name}"

    @property
    def member_count(self):
        return self.members.count()

    @property
    def total_points(self):
        """Sum of points from all correct team solves minus hint costs."""
        solves_points = self.solves.aggregate(total=models.Sum("challenge__points"))["total"] or 0
        hints_cost = self.hints_unlocked.aggregate(total=models.Sum("hint__cost"))["total"] or 0
        return max(0, solves_points - hints_cost)

    @property
    def last_solve_time(self):
        last = self.solves.order_by("-solved_at").first()
        return last.solved_at if last else None


class TeamMember(models.Model):
    team      = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="members")
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="team_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")

    def __str__(self):
        return f"{self.user.username} → {self.team.name}"


class TeamJoinRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled','Cancelled'),
    ]
    team       = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="join_requests")
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="team_join_requests")
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("team", "user")
        ordering        = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} → {self.team.name} ({self.status})"




class TeamChallenge(models.Model):
    """Records first-blood team solve for a challenge (one record per team per challenge)."""
    team      = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="solves")
    challenge = models.ForeignKey("challenges.Challenge", on_delete=models.CASCADE, related_name="team_solves")
    solved_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="team_solves")
    solved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "challenge")
        ordering = ["solved_at"]

    def __str__(self):
        return f"{self.team.name} → {self.challenge.title}"


class TeamHint(models.Model):
    """Records when a team unlocks a hint."""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="hints_unlocked")
    hint = models.ForeignKey("challenges.ChallengeHint", on_delete=models.CASCADE)
    unlocked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "hint")

    def __str__(self):
        return f"{self.team.name} unlocked {self.hint}"
