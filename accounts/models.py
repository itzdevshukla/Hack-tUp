from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.contrib.sessions.models import Session

class OTPVerification(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        # OTP is valid for 3 minutes
        return timezone.now() > self.created_at + timedelta(minutes=3)

    def __str__(self):
        return f"{self.email} - {self.otp}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    totp_secret = models.CharField(max_length=64, null=True, blank=True)
    totp_enabled = models.BooleanField(default=False)
    current_session_key = models.CharField(max_length=40, null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user.username}) TOTP={'ON' if self.totp_enabled else 'OFF'}"

@receiver(user_logged_in)
def enforce_single_session(sender, user, request=None, **kwargs):
    # Safe check if session exists
    if not getattr(request, 'session', None) or not request.session.session_key:
        return
        
    new_session_key = request.session.session_key
    
    # Robustly get or create profile
    try:
        profile, created = UserProfile.objects.get_or_create(user=user)
    except Exception:
        return
    
    # Wipe old session if it differs
    if profile.current_session_key and profile.current_session_key != new_session_key:
        try:
            Session.objects.filter(session_key=profile.current_session_key).delete()
        except Exception:
            pass
            
    profile.current_session_key = new_session_key
    try:
        profile.save(update_fields=['current_session_key'])
    except Exception:
        profile.save()

