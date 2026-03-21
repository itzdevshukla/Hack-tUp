from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse


def home(request):
    return render(request, "index.html")


@ensure_csrf_cookie
def csrf_token_view(request):
    """
    GET /api/csrf/
    Called once by the React SPA on app init.
    Django sets the csrftoken cookie in the response.
    Frontend reads it and attaches X-CSRFToken header to all POST calls.
    """
    return JsonResponse({"detail": "CSRF cookie set"})
