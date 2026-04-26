from django.db import models
from django.contrib.auth.models import User
import secrets
import string
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time


class Event(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('upcoming', 'Upcoming'),
        ('live', 'Live'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    CTF_TYPE_CHOICES = [
        ('Jeopardy Style', 'Jeopardy Style'),
        ('Attack-Defense', 'Attack-Defense'),
        ('Mixed', 'Mixed'),
        ('Red Team', 'Red Team'),
    ]

    event_name = models.CharField(max_length=200)
    venue = models.CharField(max_length=200)
    description = models.TextField(max_length=600)
    ctf_type = models.CharField(max_length=50, choices=CTF_TYPE_CHOICES)
    max_participants = models.IntegerField()

    # ===============================
    # EVENT TIMINGS
    # ===============================
    start_date = models.DateField()
    start_time = models.TimeField()
    end_date = models.DateField()
    end_time = models.TimeField()

    # ===============================
    # 🔥 REGISTRATION WINDOW (NEW)
    # ===============================
    registration_start_date = models.DateField(null=True, blank=True)
    registration_start_time = models.TimeField(null=True, blank=True)

    registration_end_date = models.DateField(null=True, blank=True)
    registration_end_time = models.TimeField(null=True, blank=True)

    rules = models.TextField(blank=True, null=True, help_text="Markdown supported rules for the event")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='upcoming'
    )

    is_paused = models.BooleanField(default=False)
    is_registration_paused = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    is_rejected = models.BooleanField(default=False)
    accepting_writeups = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False, help_text="Hide event from non-registered users")
    challenges_locked = models.BooleanField(default=False, help_text="Lock all challenges, making them invisible to participants")

    # ===============================
    # TEAM MODE
    # ===============================
    is_team_mode  = models.BooleanField(default=False, help_text="Enable team-based scoring for this event")
    max_team_size = models.PositiveIntegerField(default=4, help_text="Max members per team (team mode only)")

    access_code = models.CharField(max_length=50, unique=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.event_name

    # ===============================
    # EVENT STATUS (UNCHANGED)
    # ===============================
    def get_current_status(self):
        from datetime import datetime, time
        now = timezone.now()

        if self.is_rejected:
            return 'rejected'
        
        if not self.is_approved:
            return 'pending'

        if self.is_paused:
            return 'paused'

        s_date = parse_date(self.start_date) if isinstance(self.start_date, str) else self.start_date
        s_time = parse_time(self.start_time) if isinstance(self.start_time, str) else self.start_time
        e_date = parse_date(self.end_date) if isinstance(self.end_date, str) else self.end_date
        e_time = parse_time(self.end_time) if isinstance(self.end_time, str) else self.end_time

        if s_date:
            try:
                st = s_time if s_time else time(0, 0)
                start_dt = timezone.make_aware(datetime.combine(s_date, st))
                if now < start_dt:
                    return 'upcoming'
            except Exception:
                pass # If timezone conversion fails, ignore

        if e_date:
            try:
                et = e_time if e_time else time(23, 59)
                end_dt = timezone.make_aware(datetime.combine(e_date, et))
                if now > end_dt:
                    return 'completed'
            except Exception:
                pass

        return 'live'

    # ===============================
    # 🔐 REGISTRATION STATUS CHECK
    # ===============================


    def is_registration_open(self):
        """
        Returns True if registration window is open
        """
        if self.is_registration_paused:
            return False

        if not all([
            self.registration_start_date,
            self.registration_start_time,
            self.registration_end_date,
            self.registration_end_time
        ]):
            return False

        now = timezone.now()

        rs_date = parse_date(self.registration_start_date) if isinstance(self.registration_start_date, str) else self.registration_start_date
        rs_time = parse_time(self.registration_start_time) if isinstance(self.registration_start_time, str) else self.registration_start_time
        re_date = parse_date(self.registration_end_date) if isinstance(self.registration_end_date, str) else self.registration_end_date
        re_time = parse_time(self.registration_end_time) if isinstance(self.registration_end_time, str) else self.registration_end_time

        reg_start = datetime.combine(rs_date, rs_time)
        reg_end = datetime.combine(re_date, re_time)

        # make aware only if naive
        if timezone.is_naive(reg_start):
            reg_start = timezone.make_aware(reg_start)

        if timezone.is_naive(reg_end):
            reg_end = timezone.make_aware(reg_end)

        return reg_start <= now <= reg_end



    # ===============================
    # ACCESS CODE GENERATOR
    # ===============================
    @staticmethod
    def generate_access_code():
        while True:
            random_suffix = ''.join(
                secrets.choice(string.ascii_uppercase + string.digits)
                for _ in range(8)
            )
            code = f"Hack!tUp-{random_suffix}"
            if not Event.objects.filter(access_code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.access_code:
            self.access_code = self.generate_access_code()

        # 🔥 auto update status before save
        self.status = self.get_current_status()

        super().save(*args, **kwargs)


class EventRole(models.Model):
    ROLE_CHOICES = [
        ('organizer', 'Organizer'),
        ('admin', 'Admin')
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_roles')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.role} @ {self.event.event_name}"
