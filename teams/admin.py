from django.contrib import admin
from .models import Team, TeamMember, TeamChallenge


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    readonly_fields = ["joined_at"]


class TeamChallengeInline(admin.TabularInline):
    model = TeamChallenge
    extra = 0
    readonly_fields = ["solved_at"]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display  = ["name", "event", "captain", "invite_code", "member_count", "created_at"]
    list_filter   = ["event"]
    search_fields = ["name", "captain__username", "invite_code"]
    readonly_fields = ["invite_code", "created_at"]
    inlines       = [TeamMemberInline, TeamChallengeInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display  = ["user", "team", "joined_at"]
    list_filter   = ["team__event"]
    search_fields = ["user__username", "team__name"]


@admin.register(TeamChallenge)
class TeamChallengeAdmin(admin.ModelAdmin):
    list_display  = ["team", "challenge", "solved_by", "solved_at"]
    list_filter   = ["team__event"]
    search_fields = ["team__name", "challenge__title"]
