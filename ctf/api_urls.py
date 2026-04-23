from django.urls import path, include, register_converter
from ctf.converters import HashIdConverter
from ctf import views as ctf_views
from accounts import api_views as auth_api
from dashboard import api_views as dashboard_api
from challenges import api_views as challenge_api
from administration import api_views as admin_api

register_converter(HashIdConverter, 'hashid')

urlpatterns = [
    # CSRF
    path('csrf/', ctf_views.csrf_token_view, name='api_csrf'),

    # Auth
    path('auth/login/', auth_api.login_api, name='api_login'),
    path('auth/send-otp/', auth_api.send_registration_otp_api, name='api_send_otp'),
    path('auth/register/', auth_api.register_api, name='api_register'),
    path('auth/logout/', auth_api.logout_api, name='api_logout'),
    path('auth/status/', auth_api.user_status_api, name='api_status'),
    path('auth/change-password/', auth_api.change_password_api, name='api_change_password'),
    path('auth/delete-account/', auth_api.delete_account_api, name='api_delete_account'),
    path('auth/check-username/', auth_api.check_username_api, name='api_check_username'),
    path('auth/check-email/', auth_api.check_email_api, name='api_check_email'),
    path('auth/forgot-password/send-otp/', auth_api.forgot_password_send_otp_api, name='api_forgot_password_send_otp'),
    path('auth/forgot-password/reset/', auth_api.forgot_password_reset_api, name='api_forgot_password_reset'),
    path('auth/totp/setup/', auth_api.totp_setup_api, name='api_totp_setup'),
    path('auth/totp/enable/', auth_api.totp_enable_api, name='api_totp_enable'),
    path('auth/totp/verify/', auth_api.totp_verify_api, name='api_totp_verify'),

    # Dashboard
    path('dashboard/overview/', dashboard_api.user_dashboard_overview_api, name='api_user_dashboard_overview'),
    path('dashboard/events/', dashboard_api.dashboard_events_api, name='api_dashboard_events'),
    path('dashboard/registered-events/', dashboard_api.user_registered_events_api, name='api_user_registered_events'),
    path('dashboard/activity-heatmap/', dashboard_api.user_activity_heatmap_api, name='api_user_activity_heatmap'),
    path('dashboard/event/<hashid:event_id>/', dashboard_api.event_details_api, name='api_event_details'),
    path('dashboard/event/<hashid:event_id>/join/', dashboard_api.join_event_api, name='api_join_event'),
    path('user/request-event/', dashboard_api.user_request_event_api, name='api_user_request_event'),
    
    # Challenges
    path('event/<hashid:event_id>/challenges/', challenge_api.event_challenges_api, name='api_event_challenges'),
    path('event/<hashid:event_id>/leaderboard/', challenge_api.event_leaderboard_api, name='api_event_leaderboard'),
    path('event/<hashid:event_id>/leaderboard/history/', challenge_api.event_leaderboard_history_api, name='api_event_leaderboard_history'),
    path('event/<hashid:event_id>/announcements/', challenge_api.event_announcements_api, name='api_event_announcements'),
    path('event/<hashid:event_id>/writeups/', challenge_api.event_writeups_api, name='api_event_writeups'),
    path('challenge/<hashid:challenge_id>/submit/', challenge_api.submit_flag_api, name='api_challenge_submit'),
    path('challenge/<hashid:challenge_id>/solvers/', challenge_api.challenge_solvers_api, name='api_challenge_solvers'),
    path('hint/<hashid:hint_id>/unlock/', challenge_api.unlock_hint_api, name='api_unlock_hint'),

    # Admin Dashboard
    
    path('admin/dashboard/', admin_api.admin_dashboard_api, name='api_admin_dashboard'),
    path('admin/users/', admin_api.admin_users_api, name='api_admin_users'),
    path('admin/user/<hashid:user_id>/', admin_api.admin_user_detail_api, name='api_admin_user_detail'),
    path('admin/user/<hashid:user_id>/delete/', admin_api.admin_delete_user_api, name='api_admin_delete_user'),
    path('admin/users/import/', admin_api.admin_import_users_api, name='api_admin_import_users'),
    path('admin/events/', admin_api.admin_events_api, name='api_admin_events'),
    path('admin/event-requests/', admin_api.admin_event_requests_api, name='api_admin_event_requests'),
    path('admin/event-request/<hashid:event_id>/approve/', admin_api.admin_approve_event_api, name='api_admin_approve_event'),
    path('admin/event-request/<hashid:event_id>/decline/', admin_api.admin_decline_event_api, name='api_admin_decline_event'),
    path('admin/event/new/', admin_api.admin_add_event_api, name='api_admin_add_event'),
    path('admin/event/<hashid:event_id>/', admin_api.admin_event_detail_api, name='api_admin_event_detail'),
    path('admin/event/<hashid:event_id>/edit/', admin_api.admin_edit_event_api, name='api_admin_edit_event'),
    path('admin/event/<hashid:event_id>/rules/', admin_api.admin_update_event_rules_api, name='api_admin_update_event_rules'),
    path('admin/event/<hashid:event_id>/control/', admin_api.admin_event_control_api, name='api_admin_event_control'),
    path('admin/event/<hashid:event_id>/participants/', admin_api.admin_event_participants_api, name='api_admin_event_participants'),
    path('admin/event/<hashid:event_id>/teams/', admin_api.admin_event_teams_api, name='api_admin_event_teams'),
    path('admin/event/<hashid:event_id>/participant/<hashid:user_id>/ban/', admin_api.admin_toggle_ban_participant_api, name='api_admin_toggle_ban_participant'),
    path('admin/event/<hashid:event_id>/participant/<hashid:user_id>/remove/', admin_api.admin_remove_participant_api, name='api_admin_remove_participant'),
    path('admin/event/<hashid:event_id>/team/<hashid:team_id>/ban/', admin_api.admin_toggle_ban_team_api, name='api_admin_toggle_ban_team'),
    path('admin/event/<hashid:event_id>/team/<hashid:team_id>/delete/', admin_api.admin_delete_team_api, name='api_admin_delete_team'),
    path('admin/event/<hashid:event_id>/leaderboard/', admin_api.admin_event_leaderboard_api, name='api_admin_event_leaderboard'),
    path('admin/event/<hashid:event_id>/leaderboard/<hashid:user_id>/submissions/', admin_api.admin_user_event_submissions_api, name='api_admin_user_event_submissions'),
    path('admin/event/<hashid:event_id>/team/<hashid:team_id>/submissions/', admin_api.admin_team_submissions_api, name='api_admin_team_submissions'),
    path('admin/event/<hashid:event_id>/user/<hashid:user_id>/writeups/', admin_api.admin_user_writeups_api, name='api_admin_user_writeups'),
    path('admin/event/<hashid:event_id>/submissions/', admin_api.admin_event_submissions_api, name='api_admin_event_submissions'),
    path('admin/event/<hashid:event_id>/challenge/new/', admin_api.admin_create_challenge_api, name='api_admin_create_challenge'),
    path('admin/event/<hashid:event_id>/challenge/<hashid:challenge_id>/', admin_api.admin_challenge_detail_api, name='api_admin_challenge_detail'),
    path('admin/event/<hashid:event_id>/announcements/', admin_api.admin_create_announcement_api, name='api_admin_create_announcement'),
    path('admin/event/<hashid:event_id>/announcements/<hashid:announcement_id>/delete/', admin_api.admin_delete_announcement_api, name='api_admin_delete_announcement'),
    path('admin/event/<hashid:event_id>/waves/', admin_api.admin_waves_api, name='api_admin_waves'),
    path('admin/event/<hashid:event_id>/wave/<hashid:wave_id>/', admin_api.admin_wave_detail_api, name='api_admin_wave_detail'),
    path('admin/event/<hashid:event_id>/wave/<hashid:wave_id>/challenges/', admin_api.admin_wave_challenges_api, name='api_admin_wave_challenges'),
    path('admin/event/<hashid:event_id>/roles/', admin_api.admin_event_roles_api, name='api_admin_event_roles'),
    path('event/<hashid:event_id>/announcements/', challenge_api.event_announcements_api, name='api_event_announcements'),
    path('admin/event/<hashid:event_id>/delete/', admin_api.admin_delete_event_api, name='api_admin_delete_event'),
    path('admin/event/<hashid:event_id>/export/', admin_api.admin_export_event_data_api, name='api_admin_export_event_data'),
    path('admin/event/<hashid:event_id>/test-challenges/', admin_api.admin_test_challenges_list_api, name='api_admin_test_challenges'),
    path('admin/challenge/<hashid:challenge_id>/test-flag/', admin_api.admin_test_challenge_flag_api, name='api_admin_test_challenge_flag'),

    # Teams
    path('teams/', include('teams.urls')),
]
