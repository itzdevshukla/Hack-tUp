from django.shortcuts import render, redirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from administration.models import EventRole

def home(request):
    # 🔒 Server-side path protection for administration
    if request.path.strip('/').startswith('administration'):
        if not request.user.is_authenticated:
            return redirect('/login')

        # Source-of-truth admin check
        has_admin_access = (
            request.user.is_staff or
            request.user.is_superuser or
            EventRole.objects.filter(user=request.user).exists()
        )

        if not has_admin_access:
            return redirect('/dashboard')

        # 🔒 TOTP gate — admin must have verified TOTP
        if not request.session.get('totp_verified', False):
            return redirect('/login?reason=totp_required')

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
