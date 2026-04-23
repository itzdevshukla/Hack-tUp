from django.contrib import admin
from .models import Challenge, UserChallenge, ChallengeHint, UserHint, ChallengeAttachment

class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'points', 'event', 'created_at')
    list_filter = ('category', 'difficulty', 'event')
    search_fields = ('title', 'description', 'flag')

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

class ChallengeHintAdmin(admin.ModelAdmin):
    list_display = ('challenge', 'cost', 'timestamp')
    list_filter = ('challenge',)

class UserHintAdmin(admin.ModelAdmin):
    list_display = ('user', 'hint', 'unlocked_at')
    search_fields = ('user__username', 'hint__content')

class ChallengeAttachmentAdmin(admin.ModelAdmin):
    list_display = ('challenge', 'file', 'uploaded_at')
    search_fields = ('challenge__title',)

# Safe Registration
models_to_register = [
    (Challenge, ChallengeAdmin),
    (UserChallenge, UserChallengeAdmin),
    (ChallengeHint, ChallengeHintAdmin),
    (UserHint, UserHintAdmin),
    (ChallengeAttachment, ChallengeAttachmentAdmin)
]

for model, admin_class in models_to_register:
    try:
        admin.site.register(model, admin_class)
    except admin.sites.AlreadyRegistered:
        pass
