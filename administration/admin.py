from django.contrib import admin
from .models import Event, EventRole

class EventRoleInline(admin.TabularInline):
    model = EventRole
    extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'status', 'start_date', 'created_by', 'is_team_mode', 'is_hidden')
    list_filter = ('status', 'ctf_type', 'is_team_mode', 'is_hidden', 'challenges_locked')
    search_fields = ('event_name', 'venue', 'access_code')
    ordering = ('-created_at',)
    inlines = [EventRoleInline]
    readonly_fields = ('access_code', 'created_at', 'updated_at')

@admin.register(EventRole)
class EventRoleAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'role', 'created_at')
    list_filter = ('role', 'event')
    search_fields = ('user__username', 'event__event_name', 'role')
    readonly_fields = ('created_at',)
