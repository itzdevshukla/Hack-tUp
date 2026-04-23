from django.contrib import admin
from .models import Category, Challenge, UserChallenge, ChallengeHint, UserHint, ChallengeAttachment, ChallengeWave

# --- HELPER FOR SAFE REGISTRATION ---
def safe_register(model, admin_class=None):
    try:
        if admin.site.is_registered(model):
            admin.site.unregister(model)
        if admin_class:
            admin.site.register(model, admin_class)
        else:
            admin.site.register(model)
    except Exception:
        pass

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'order')
    search_fields = ('name',)

class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'points', 'event', 'wave')
    list_filter = ('category', 'difficulty', 'event', 'wave')
    search_fields = ('title', 'description', 'flag')
    autocomplete_fields = ('category', 'event', 'wave')

class UserChallengeAdmin(admin.ModelAdmin):
    list_display = ('user', 'challenge', 'is_correct', 'submitted_at')
    list_filter = ('is_correct', 'submitted_at', 'challenge__event')
    search_fields = ('user__username', 'challenge__title', 'submitted_flag')
    readonly_fields = ('submitted_at',)
    
    actions = ['mark_as_correct', 'mark_as_incorrect']

    def mark_as_correct(self, request, queryset):
        queryset.update(is_correct=True)
    mark_as_correct.short_description = "✅ Mark selected submissions as CORRECT"

    def mark_as_incorrect(self, request, queryset):
        queryset.update(is_correct=False)
    mark_as_incorrect.short_description = "❌ Mark selected submissions as INCORRECT"

class ChallengeWaveAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'order', 'is_active')
    list_filter = ('event', 'is_active')
    search_fields = ('name',)

safe_register(Category, CategoryAdmin)
safe_register(Challenge, ChallengeAdmin)
safe_register(UserChallenge, UserChallengeAdmin)
safe_register(ChallengeWave, ChallengeWaveAdmin)
safe_register(ChallengeHint)
safe_register(UserHint)
safe_register(ChallengeAttachment)
