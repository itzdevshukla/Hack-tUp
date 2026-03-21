from django.urls import path
from . import api_views as team_api

# All routes are mounted under /api/teams/ from ctf/api_urls.py
urlpatterns = [
    path("event/<hashid:event_id>/",         team_api.list_teams_api,         name="api_team_list"),
    path("event/<hashid:event_id>/my-team/", team_api.my_team_api,            name="api_team_my"),
    path("event/<hashid:event_id>/create/",  team_api.create_team_api,        name="api_team_create"),
    path("event/<hashid:event_id>/join/",    team_api.join_team_api,          name="api_team_join"),
    path("<hashid:team_id>/leave/",          team_api.leave_team_api,         name="api_team_leave"),
    path("<hashid:team_id>/kick/",           team_api.kick_member_api,        name="api_team_kick"),
    # Join request management
    path("requests/<hashid:request_id>/cancel/",                     team_api.cancel_join_request_api,  name="api_team_request_cancel"),
    path("<hashid:team_id>/requests/<hashid:request_id>/",           team_api.handle_join_request_api,  name="api_team_request_handle"),
]
