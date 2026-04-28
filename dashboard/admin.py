from django.contrib import admin
from .models import EventAccess

@admin.register(EventAccess)
class EventAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'granted_at', 'is_banned', 'is_registered')
    list_filter = ('event', 'is_banned', 'is_registered')
    search_fields = ('user__username', 'event__event_name')
