# Register your models here.
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

# Unregister default User admin
admin.site.unregister(User)

# Register with custom display
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

# Site header
admin.site.site_header = "Hack!t Admin Portal"
admin.site.site_title = "Hack!t Admin"
admin.site.index_title = "Welcome to Hack!t Administration"




from django.contrib import admin
from django.contrib.auth.hashers import make_password
from challenges.models import Challenge, ChallengeAttachment


class ChallengeAttachmentInline(admin.TabularInline):
    model = ChallengeAttachment
    extra = 1


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    inlines = [ChallengeAttachmentInline]

    def save_model(self, request, obj, form, change):
        # ✅ auto-hash flag
        if not obj.flag.startswith("pbkdf2_"):
            obj.flag = make_password(obj.flag)
        super().save_model(request, obj, form, change)

