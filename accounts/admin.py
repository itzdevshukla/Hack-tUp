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

from django.contrib.admin.forms import AdminAuthenticationForm
from django import forms
from django.contrib.auth import authenticate

class EmailAdminAuthenticationForm(AdminAuthenticationForm):
    username = forms.EmailField(widget=forms.EmailInput(attrs={'autofocus': True}), label="Email Address")

    def clean(self):
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                self.user_cache = authenticate(self.request, username=user.username, password=password)
            except User.DoesNotExist:
                self.user_cache = None

            if self.user_cache is None:
                raise self.get_invalid_login_error()
            else:
                self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data

# Site header
admin.site.site_header = "Hack!tUp Admin Portal"
admin.site.site_title = "Hack!tUp Admin"
admin.site.index_title = "Welcome to Hack!tUp Administration"
admin.site.login_form = EmailAdminAuthenticationForm


from .models import OTPVerification, UserProfile

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp', 'created_at', 'is_verified', 'is_expired_display')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('email', 'otp')
    readonly_fields = ('created_at',)
    
    def is_expired_display(self, obj):
        return obj.is_expired()
    is_expired_display.boolean = True
    is_expired_display.short_description = 'Expired'

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'totp_enabled', 'has_session')
    list_filter = ('totp_enabled',)
    search_fields = ('user__username', 'user__email')
    
    def has_session(self, obj):
        return bool(obj.current_session_key)
    has_session.boolean = True
    has_session.short_description = 'Active Session'
