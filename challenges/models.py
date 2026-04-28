from django.db import models
from django.conf import settings
from django.utils import timezone
from administration.models import Event


class ChallengeWave(models.Model):
    """A named batch of challenges released manually by the organiser."""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='waves'
    )
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower = first)")
    is_active = models.BooleanField(default=False, help_text="When True, all challenges in this wave become visible to participants")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.event.event_name} — {self.name} ({'Live' if self.is_active else 'Locked'})"


class Challenge(models.Model):

    CATEGORY_CHOICES = [
        ('web', 'Web Exploitation'),
        ('crypto', 'Cryptography'),
        ('osint', 'OSINT'),
        ('pwn', 'Binary Exploitation (Pwn)'),
        ('forensics', 'Digital Forensics'),
        ('re', 'Reverse Engineering'),
        ('mobile', 'Mobile Security'),
        ('hardware', 'Hardware / IoT'),
        ('stego', 'Steganography'),
        ('misc', 'Miscellaneous'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('insane', 'Insane'),
    ]

    # ================= CORE FIELDS =================

    event = models.ForeignKey(
        Event,
        on_delete=models.SET_NULL,
        null=True,
        related_name='challenges'
    )

    wave = models.ForeignKey(
        ChallengeWave,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='challenges',
        help_text="Leave blank to make challenge always visible regardless of waves"
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES
    )

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES
    )

    points = models.PositiveIntegerField()
    
    url = models.URLField(
        blank=True, 
        null=True,
        help_text="Link to the challenge instance (if applicable)"
    )

    flag_format = models.CharField(
        max_length=100,
        default="Hack!tUp{...}",
        help_text="Format of the flag (e.g. Hack!tUp{...})",
        blank=True
    )

    flag = models.CharField(
        max_length=255,
        help_text="Correct flag (will be hashed on save)"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    def save(self, *args, **kwargs):
        from django.contrib.auth.hashers import make_password
        # Check if flag is already hashed (simple check for Django hash format)
        if not self.flag.startswith('pbkdf2_sha256$'):
            self.flag = make_password(self.flag)
        super().save(*args, **kwargs)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} ({self.category})"


# =================================================
# USER ↔ CHALLENGE SUBMISSIONS
# =================================================

class UserChallenge(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE
    )

    submitted_flag = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} → {self.challenge.title}"


class ChallengeHint(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="hints"
    )
    content = models.TextField(help_text="The hint text")
    cost = models.PositiveIntegerField(default=0, help_text="Points deducted to unlock")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hint for {self.challenge.title} (-{self.cost})"


class UserHint(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    hint = models.ForeignKey(
        ChallengeHint,
        on_delete=models.CASCADE,
        null=True
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'hint')

    def __str__(self):
        return f"{self.user.username} unlocked {self.hint}"


import uuid
import os

def challenge_attachment_upload_path(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else ''
    new_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    return os.path.join("challenge_attachments/", new_name)


class ChallengeAttachment(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    file = models.FileField(
        upload_to=challenge_attachment_upload_path
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.challenge.title} - {self.file.name}"



class Announcement(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('danger', 'Danger'),
        ('success', 'Success')
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=200)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.event.event_name}] {self.title}'


class WriteUp(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='writeups')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='writeups')
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'challenge')

    def __str__(self):
        return f'{self.user.username} WriteUp: {self.challenge.title}'
