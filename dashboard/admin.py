from django.contrib import admin
from .models import EventAccess, EventRegistration

@admin.register(EventAccess)
class EventAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'granted_at', 'is_banned', 'is_registered')
    list_filter = ('event', 'is_banned', 'is_registered')
    search_fields = ('user__username', 'event__event_name', 'user__email')
    
    actions = ['ban_users', 'unban_users', 'approve_registrations']

    def ban_users(self, request, queryset):
        queryset.update(is_banned=True)
        self.message_user(request, "🛡️ Selected users have been BANNED from their respective events.")
    ban_users.short_description = "🚫 BAN selected participants"

    def unban_users(self, request, queryset):
        queryset.update(is_banned=False)
        self.message_user(request, "✅ Selected users have been UNBANNED.")
    unban_users.short_description = "🔓 UNBAN selected participants"

    def approve_registrations(self, request, queryset):
        queryset.update(is_registered=True)
        self.message_user(request, "🎯 Selected registrations have been APPROVED.")
    approve_registrations.short_description = "✅ APPROVE selected registrations"

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'registered_at')
    list_filter = ('event',)
    search_fields = ('user__username', 'event__event_name')
