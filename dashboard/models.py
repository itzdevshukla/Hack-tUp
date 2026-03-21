# dashboard/models.py (or administration/models.py)

from django.db import models
from django.contrib.auth.models import User
from administration.models import Event

class EventAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    granted_at = models.DateTimeField(auto_now_add=True)
    is_banned = models.BooleanField(default=False) 
    is_registered = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} → {self.event.event_name}"




from django.db import models
from django.contrib.auth.models import User
from administration.models import Event

class EventRegistration(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "event")

    def __str__(self):
        return f"{self.user.username} → {self.event.event_name}"


