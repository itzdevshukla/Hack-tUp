import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from administration.models import EventRole
from django.contrib.auth.decorators import login_required
from ctf.utils import encode_id

@require_POST
def login_api(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()
            assigned_event_id = None
            if has_admin_access and not user.is_staff and not user.is_superuser:
                first_role = EventRole.objects.filter(user=user).first()
                if first_role:
                    assigned_event_id = first_role.event_id

            return JsonResponse({
                'success': True,
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'has_admin_access': has_admin_access,
                    'assigned_event_id': encode_id(assigned_event_id)
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid credentials'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

@require_POST
def register_api(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        
        if not username or not password:
             return JsonResponse({'success': False, 'error': 'Username and password required'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)
            
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        
        has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()
        assigned_event_id = None
        if has_admin_access and not user.is_staff and not user.is_superuser:
            first_role = EventRole.objects.filter(user=user).first()
            if first_role:
                assigned_event_id = first_role.event_id

        return JsonResponse({
            'success': True,
            'user': {
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'has_admin_access': has_admin_access,
                'assigned_event_id': encode_id(assigned_event_id)
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully'})

@require_GET
@ensure_csrf_cookie
def user_status_api(request):
    if request.user.is_authenticated:
        has_admin_access = request.user.is_staff or request.user.is_superuser or EventRole.objects.filter(user=request.user).exists()
        assigned_event_id = None
        if has_admin_access and not request.user.is_staff and not request.user.is_superuser:
            first_role = EventRole.objects.filter(user=request.user).first()
            if first_role:
                assigned_event_id = first_role.event_id

        return JsonResponse({
            'is_authenticated': True,
            'user': {
                'id': encode_id(request.user.id),
                'username': request.user.username,
                'email': request.user.email,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
                'has_admin_access': has_admin_access,
                'assigned_event_id': encode_id(assigned_event_id),
                'date_joined': request.user.date_joined.strftime("%b %Y") if request.user.date_joined else "Unknown"
            }
        })
        return JsonResponse({
            'is_authenticated': False,
            'user': None
        })

@require_POST
@login_required
def change_password_api(request):
    import json
    from django.contrib.auth import update_session_auth_hash
    
    try:
        data = json.loads(request.body)
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            return JsonResponse({'success': False, 'message': 'Missing fields.'}, status=400)
            
        if not request.user.check_password(old_password):
            return JsonResponse({'success': False, 'message': 'Incorrect current password.'}, status=400)
            
        request.user.set_password(new_password)
        request.user.save()
        
        # Keep user logged in after password change
        update_session_auth_hash(request, request.user)
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_POST
@login_required
def delete_account_api(request):
    import json
    try:
        data = json.loads(request.body)
        password = data.get('password')
        
        if not password:
            return JsonResponse({'success': False, 'message': 'Password required.'}, status=400)
            
        if not request.user.check_password(password):
            return JsonResponse({'success': False, 'message': 'Incorrect password.'}, status=400)
            
        # Optional: Perform any custom cleanup here before hard deleting
        # such as re-assigning user's created events if needed, but for now just delete.
        request.user.delete()
        
        # Ensure session is wiped
        logout(request)
        
        return JsonResponse({'success': True, 'message': 'Account deleted successfully.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
