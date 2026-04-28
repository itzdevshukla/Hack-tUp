from django.contrib import admin
from django.contrib.auth.hashers import make_password
from .models import (
    Challenge, UserChallenge, ChallengeHint, UserHint, ChallengeAttachment,
    ChallengeWave, Announcement, WriteUp
)

class ChallengeAttachmentInline(admin.TabularInline):
    model = ChallengeAttachment
    extra = 1

@admin.register(ChallengeWave)
class ChallengeWaveAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'order', 'is_active', 'created_at')
    list_filter = ('event', 'is_active')
    search_fields = ('name', 'event__event_name')
    ordering = ('event', 'order')

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'points', 'event', 'wave', 'created_at')
    list_filter = ('category', 'difficulty', 'event', 'wave')
    search_fields = ('title', 'description', 'flag')
    inlines = [ChallengeAttachmentInline]

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        initial['author'] = request.user.pk
        return initial

    def save_model(self, request, obj, form, change):
        # ✅ auto-hash flag
        if not obj.flag.startswith("pbkdf2_"):
            obj.flag = make_password(obj.flag)
        super().save_model(request, obj, form, change)

@admin.register(UserChallenge)
class UserChallengeAdmin(admin.ModelAdmin):
    list_display = ('user', 'challenge', 'is_correct', 'submitted_at')
    list_filter = ('is_correct', 'submitted_at')
    search_fields = ('user__username', 'challenge__title', 'submitted_flag')

    def save_model(self, request, obj, form, change):
        if obj.is_correct:
            # Check if user already solved this challenge (excluding this specific record)
            already_solved = UserChallenge.objects.filter(
                user=obj.user, 
                challenge=obj.challenge, 
                is_correct=True
            ).exclude(pk=obj.pk).exists()

            if already_solved:
                from django.contrib import messages
                messages.error(request, f"❌ Validation Error: {obj.user.username} has already solved '{obj.challenge.title}'. Cannot mark another submission as correct to prevent point overflow.")
                return # Do not save

        super().save_model(request, obj, form, change)

@admin.register(ChallengeHint)
class ChallengeHintAdmin(admin.ModelAdmin):
    list_display = ('challenge', 'cost', 'timestamp')
    list_filter = ('challenge',)

@admin.register(UserHint)
class UserHintAdmin(admin.ModelAdmin):
    list_display = ('user', 'hint', 'unlocked_at')
    search_fields = ('user__username', 'hint__content')

@admin.register(ChallengeAttachment)
class ChallengeAttachmentAdmin(admin.ModelAdmin):
    list_display = ('challenge', 'file', 'uploaded_at')
    search_fields = ('challenge__title',)

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'event', 'type', 'created_by', 'created_at')
    list_filter = ('type', 'event')
    search_fields = ('title', 'content', 'event__event_name')

@admin.register(WriteUp)
class WriteUpAdmin(admin.ModelAdmin):
    list_display = ('user', 'challenge', 'updated_at')
    list_filter = ('challenge__event',)
    search_fields = ('user__username', 'challenge__title')
