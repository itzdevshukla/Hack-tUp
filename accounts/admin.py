# Register your models here.
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from import_export.forms import ImportForm, ConfirmImportForm
from django import forms
from dashboard.models import EventAccess
from administration.models import Event
from teams.models import Team, TeamMember
import secrets
import string

# Unregister default User admin
admin.site.unregister(User)

class CustomImportForm(ImportForm):
    event = forms.ModelChoiceField(
        queryset=Event.objects.all(),
        required=True,
        help_text="Select Event. Required Excel columns: first_name, last_name, email, team_name (optional), role (optional: leader/member)."
    )

class CustomConfirmImportForm(ConfirmImportForm):
    event = forms.ModelChoiceField(
        queryset=Event.objects.all(),
        widget=forms.HiddenInput()
    )

class UserResource(resources.ModelResource):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'username', 'password')
        import_id_fields = ('email',)

    def __init__(self, **kwargs):
        super().__init__()
        self.request = kwargs.get('request')
        self.target_event = kwargs.get('event')
        self.team_roles = {}
        self.team_counters = {}
        self.total_team_members = {}
        self.generated_credentials = []

    def before_import_row(self, row, **kwargs):
        from django.utils.html import escape
        email = row.get('email', '').strip()
        first_name = row.get('first_name', '').strip()[:100]  # Max 100 for safety (DB is 150)
        team_name = str(row.get('team_name', '')).strip()[:100]  # Max 100 in Team model
        role = str(row.get('role', '')).strip().lower()
        if 'last_name' in row:
            row['last_name'] = str(row['last_name']).strip()[:100]

        # Security Patch: Prevent overwriting Staff or Superuser accounts
        if User.objects.filter(email=email, is_staff=True).exists():
            raise ValueError(f"Cannot import or overwrite the admin/staff account associated with '{escape(email)}'.")

        # Security Patch: Prevent Infinite Loop DoS on blank first names
        if not first_name:
            first_name = 'user'

        # Ignore team_name and role if the selected event is a SOLO event
        if self.target_event and getattr(self.target_event, 'is_team_mode', False) == False:
            team_name = ''
            role = ''

        if team_name:
            team_name = str(team_name).strip()

            # Enforce max team size validation
            if not hasattr(self, 'total_team_members'):
                self.total_team_members = {}
            if team_name not in self.total_team_members:
                existing_count = 0
                if self.target_event:
                    from teams.models import Team
                    existing_team = Team.objects.filter(event=self.target_event, name=team_name).first()
                    if existing_team:
                        existing_count = existing_team.members.count()
                self.total_team_members[team_name] = existing_count

            self.total_team_members[team_name] += 1
            if self.target_event and getattr(self.target_event, 'max_team_size', None):
                if self.total_team_members[team_name] > self.target_event.max_team_size:
                    raise ValueError(f"Team '{escape(team_name)}' exceeds the maximum allowed size of {self.target_event.max_team_size} members.")

        self.team_roles[email] = (team_name, role)

        # Generate Username
        username = None
        if team_name:
            clean_team = "".join(c for c in team_name if c.isalnum() or c == '_').lower()
            if not clean_team:
                clean_team = 'team'
            if role == 'leader':
                username = f"{clean_team}_leader"
            else:
                if team_name not in self.team_counters:
                    self.team_counters[team_name] = 1
                counter = self.team_counters[team_name]
                self.team_counters[team_name] += 1
                username = f"{clean_team}_member_{counter}"
        else:
            suffix = "".join(secrets.choice(string.digits) for _ in range(6))
            username = f"{first_name.lower()}_{suffix}"

        while User.objects.filter(username=username).exists():
            suffix = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6))
            username = f"{username}_{suffix}"

        row['username'] = username

        # Generate Password
        chars = string.ascii_letters + string.digits
        password = "".join(secrets.choice(chars) for _ in range(12))
        row['password'] = password

        cred_dict = {
            'First Name': first_name,
            'Last Name': row.get('last_name', ''),
            'Email': email,
        }
        
        if self.target_event and getattr(self.target_event, 'is_team_mode', False):
            cred_dict['Team Name'] = team_name
            cred_dict['Role'] = role
            
        cred_dict['Username'] = username
        cred_dict['Plain Password'] = password

        self.generated_credentials.append(cred_dict)

    def after_import(self, dataset, result, using_transactions, dry_run, **kwargs):
        if not dry_run and self.request:
            self.request.session['generated_credentials'] = self.generated_credentials

    def after_save_instance(self, instance, row, **kwargs):
        super().after_save_instance(instance, row, **kwargs)
        dry_run = kwargs.get('dry_run', False)
        if not dry_run and self.target_event:
            # Ensure password is hashed
            if instance.password and not instance.password.startswith('pbkdf2_'):
                instance.set_password(instance.password)
                instance.save()

            # Grant Event Access
            EventAccess.objects.get_or_create(
                user=instance,
                event=self.target_event,
                defaults={'is_registered': True}
            )

            # Handle Team Assignment
            team_info = self.team_roles.get(instance.email)
            if team_info:
                team_name, role = team_info
                if team_name:
                    team = Team.objects.filter(event=self.target_event, name=team_name).first()
                    if not team:
                        team = Team.objects.create(
                            event=self.target_event,
                            name=team_name,
                            captain=instance
                        )
                        if not hasattr(self, 'newly_created_teams'):
                            self.newly_created_teams = set()
                        self.newly_created_teams.add(team.id)
                    
                    # Security Patch: Prevent Team Hijacking.
                    # Only allow setting the captain if the team was created during THIS import batch.
                    if role == 'leader':
                        if getattr(self, 'newly_created_teams', None) and team.id in self.newly_created_teams:
                            if team.captain != instance:
                                team.captain = instance
                                team.save()

                    TeamMember.objects.get_or_create(team=team, user=instance)


# Register with custom display
@admin.register(User)
class CustomUserAdmin(ImportExportModelAdmin, UserAdmin):
    resource_class = UserResource
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    import_form_class = CustomImportForm
    confirm_form_class = CustomConfirmImportForm

    def get_resource_kwargs(self, request, *args, **kwargs):
        resource_kwargs = super().get_resource_kwargs(request, *args, **kwargs)
        resource_kwargs['request'] = request
        event_id = request.POST.get('event')
        if event_id:
            resource_kwargs['event'] = Event.objects.filter(id=event_id).first()
        return resource_kwargs

    def get_confirm_form_initial(self, request, import_form):
        initial = super().get_confirm_form_initial(request, import_form)
        if import_form and import_form.is_valid():
            initial['event'] = import_form.cleaned_data['event'].id
        return initial

    def process_result(self, result, request):
        response = super().process_result(result, request)
        credentials = request.session.pop('generated_credentials', None)
        if credentials:
            import csv
            from django.http import HttpResponse
            
            def sanitize_csv_field(value):
                value_str = str(value) if value is not None else ''
                # Security Patch: Prevent CSV Injection
                if value_str.startswith(('=', '+', '-', '@')):
                    return f"'{value_str}"
                return value_str
            
            csv_response = HttpResponse(content_type='text/csv')
            csv_response['Content-Disposition'] = 'attachment; filename="imported_user_credentials.csv"'
            
            writer = csv.writer(csv_response)
            if credentials:
                writer.writerow(credentials[0].keys())
                for cred in credentials:
                    sanitized_values = [sanitize_csv_field(v) for v in cred.values()]
                    writer.writerow(sanitized_values)
            return csv_response
        return response

from django.contrib.admin.forms import AdminAuthenticationForm
from django import forms
from django.contrib.auth import authenticate

class EmailAdminAuthenticationForm(AdminAuthenticationForm):
    username = forms.EmailField(widget=forms.EmailInput(attrs={'autofocus': True}), label="Email Address")

    def clean(self):
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if email and password:
            # Query for an active staff member with this email to prevent DoS via MultipleObjectsReturned
            user = User.objects.filter(email=email, is_staff=True, is_active=True).first()
            
            if user:
                self.user_cache = authenticate(self.request, username=user.username, password=password)
            else:
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
class UserProfileAdmin(ImportExportModelAdmin):
    list_display = ('user', 'totp_enabled', 'has_session')
    list_filter = ('totp_enabled',)
    search_fields = ('user__username', 'user__email')
    
    def has_session(self, obj):
        return bool(obj.current_session_key)
    has_session.boolean = True
    has_session.short_description = 'Active Session'
