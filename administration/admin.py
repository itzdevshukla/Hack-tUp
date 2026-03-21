from django.contrib import admin
from .models import Event, EventRole

class EventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'status', 'start_date', 'created_by')
    list_filter = ('status', 'ctf_type')
    search_fields = ('event_name', 'venue', 'access_code')
    ordering = ('-created_at',)

class EventRoleAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'role', 'created_at')
    list_filter = ('role', 'event')
    search_fields = ('user__username', 'event__event_name', 'role')

try:
    admin.site.register(Event, EventAdmin)
    admin.site.register(EventRole, EventRoleAdmin)
except admin.sites.AlreadyRegistered:
    pass
