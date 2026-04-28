from django.contrib import admin
from .models import EventAccess, EventRegistration

@admin.register(EventAccess)
class EventAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'granted_at', 'is_banned', 'is_registered')
    list_filter = ('event', 'is_banned', 'is_registered')
    search_fields = ('user__username', 'event__event_name')

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'registered_at')
    list_filter = ('event',)
    search_fields = ('user__username', 'event__event_name')
