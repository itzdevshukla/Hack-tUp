from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

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

    def __str__(self):
        return f"Profile({self.user.username}) TOTP={'ON' if self.totp_enabled else 'OFF'}"

