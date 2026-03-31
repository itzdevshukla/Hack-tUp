import json
import logging
import pyotp
import qrcode
import io
import base64
from django_ratelimit.decorators import ratelimit

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from administration.models import EventRole
from django.contrib.auth.decorators import login_required
from ctf.utils import encode_id, generate_otp, send_otp_email, send_reset_password_email
from .models import OTPVerification, UserProfile
from django.utils import timezone

logger = logging.getLogger(__name__)


@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def login_api(request):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many login attempts. Please wait 1 minute.'}, status=429)
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()

            if has_admin_access:
                # ── Admin TOTP gate ──
                # Store user ID in session but DO NOT call login() yet.
                # This keeps request.user.is_authenticated as False, preventing bypass.
                request.session['pre_totp_user_id'] = user.id
                
                profile, _ = UserProfile.objects.get_or_create(user=user)

                if not profile.totp_enabled:
                    return JsonResponse({
                        'success': True,
                        'requires_totp_setup': True,
                    })
                else:
                    return JsonResponse({
                        'success': True,
                        'requires_totp': True,
                    })
            else:
                # Normal (non-admin) user — full login immediately
                login(request, user)
                request.session['totp_verified'] = True  # Non-admins always pass
                return JsonResponse({
                    'success': True,
                    'user': {
                        'username': user.username,
                        'email': user.email,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser,
                        'has_admin_access': False,
                        'assigned_event_id': None
                    }
                })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid credentials, Please Try Again'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def send_registration_otp_api(request):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many OTP requests from this IP. Please wait 1 minute.'}, status=429)
    import re
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        username = data.get('username', '').strip()

        if not email or not username:
            return JsonResponse({'success': False, 'error': 'Email and username required'}, status=400)

        # Validate username format
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
            return JsonResponse({'success': False, 'error': 'Username must be 3-20 characters and contain only letters, numbers, and underscores'}, status=400)

        # Validate email format
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return JsonResponse({'success': False, 'error': 'Invalid email format'}, status=400)

        # Validate password complexity (if password is provided in this step, though usually it's in the final step)
        password = data.get('password')
        if password:
            if not (8 <= len(password) <= 16):
                return JsonResponse({'success': False, 'error': 'Password must be between 8 and 16 characters'}, status=400)
            if not re.search(r'[a-z]', password) or not re.search(r'[A-Z]', password) or not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                return JsonResponse({'success': False, 'error': 'Password must contain at least one uppercase letter, one lowercase letter, and one special character'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)

        otp = generate_otp()
        
        # Update or create OTP record
        OTPVerification.objects.update_or_create(
            email=email,
            defaults={'otp': otp, 'created_at': timezone.now(), 'is_verified': False}
        )

        try:
            send_otp_email(email, otp)
            return JsonResponse({'success': True, 'message': 'OTP sent successfully'})
        except Exception as e:
            logger.exception("Failed to send OTP email to %s", email)
            return JsonResponse({'success': False, 'error': 'Failed to send OTP email. Please try again later.'}, status=500)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception:
        logger.exception("Unexpected error in send_registration_otp_api")
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred. Please try again.'}, status=500)

@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def register_api(request):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many registration attempts. Please wait 1 minute.'}, status=429)
    import re
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password')
        email = data.get('email', '').strip().lower()
        otp = data.get('otp')
        
        if not username or not password or not email or not otp:
             return JsonResponse({'success': False, 'error': 'Username, password, email, and OTP required'}, status=400)

        # Validate username format
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
            return JsonResponse({'success': False, 'error': 'Invalid username format'}, status=400)

        # Validate password complexity
        if not (8 <= len(password) <= 16):
            return JsonResponse({'success': False, 'error': 'Password must be between 8 and 16 characters'}, status=400)
        if not re.search(r'[a-z]', password) or not re.search(r'[A-Z]', password) or not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return JsonResponse({'success': False, 'error': 'Password must contain at least one uppercase letter, one lowercase letter, and one special character'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)

        # Verify OTP
        try:
            otp_record = OTPVerification.objects.get(email=email)
            if otp_record.otp.upper() != otp.upper():
                return JsonResponse({'success': False, 'error': 'Invalid OTP'}, status=400)
            if otp_record.is_expired():
                return JsonResponse({'success': False, 'error': 'OTP expired. Please request a new one.'}, status=400)
        except OTPVerification.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'OTP not found. Please request an OTP first.'}, status=400)
            
        user = User.objects.create_user(username=username, email=email, password=password)
        
        # Mark OTP as verified (optional if we delete it or just keep for record)
        otp_record.is_verified = True
        otp_record.save()
        
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
            
        import re
        if not (8 <= len(new_password) <= 16):
            return JsonResponse({'success': False, 'message': 'Password must be between 8 and 16 characters.'}, status=400)
        if not re.search(r'[a-z]', new_password) or not re.search(r'[A-Z]', new_password) or not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
            return JsonResponse({'success': False, 'message': 'Password must contain uppercase, lowercase, and a special character.'}, status=400)
            
        if not request.user.check_password(old_password):
            return JsonResponse({'success': False, 'message': 'Incorrect current password.'}, status=400)
            
        request.user.set_password(new_password)
        request.user.save()
        
        # Keep user logged in after password change
        update_session_auth_hash(request, request.user)
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully.'})
    except Exception:
        logger.exception("Unexpected error in change_password_api")
        return JsonResponse({'success': False, 'message': 'An unexpected error occurred.'}, status=500)


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
    except Exception:
        logger.exception("Unexpected error in delete_account_api")
        return JsonResponse({'success': False, 'message': 'An unexpected error occurred.'}, status=500)


@require_GET
def check_username_api(request):
    username = request.GET.get('username', '').strip()
    if not username:
        return JsonResponse({'available': False, 'error': 'Username required'})
    
    exists = User.objects.filter(username=username).exists()
    return JsonResponse({'available': not exists})


@require_GET
def check_email_api(request):
    email = request.GET.get('email', '').strip().lower()
    if not email:
        return JsonResponse({'available': False, 'error': 'Email required'})
    
    exists = User.objects.filter(email=email).exists()
    return JsonResponse({'available': not exists})


@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def forgot_password_send_otp_api(request):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many requests from this IP. Please wait 1 minute.'}, status=429)
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()

        if not email:
            return JsonResponse({'success': False, 'error': 'Email is required.'}, status=400)

        if not User.objects.filter(email=email).exists():
            # Don't reveal if email exists — generic message for security
            return JsonResponse({'success': True, 'message': 'If this email is registered, an OTP has been sent.'})

        otp = generate_otp()
        OTPVerification.objects.update_or_create(
            email=email,
            defaults={'otp': otp, 'created_at': timezone.now(), 'is_verified': False}
        )

        try:
            send_reset_password_email(email, otp)
        except Exception:
            logger.exception("Failed to send forgot password OTP to %s", email)
            return JsonResponse({'success': False, 'error': 'Failed to send OTP email. Please try again later.'}, status=500)

        return JsonResponse({'success': True, 'message': 'If this email is registered, an OTP has been sent.'})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    except Exception:
        logger.exception("Unexpected error in forgot_password_send_otp_api")
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'}, status=500)


@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def forgot_password_reset_api(request):
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many attempts. Please wait 1 minute.'}, status=429)
    import re
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        new_password = data.get('new_password', '')

        if not email or not otp or not new_password:
            return JsonResponse({'success': False, 'error': 'Email, OTP, and new password are required.'}, status=400)

        # Password complexity check
        if not (8 <= len(new_password) <= 16):
            return JsonResponse({'success': False, 'error': 'Password must be between 8 and 16 characters.'}, status=400)
        if not re.search(r'[a-z]', new_password) or not re.search(r'[A-Z]', new_password) or not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
            return JsonResponse({'success': False, 'error': 'Password must contain uppercase, lowercase, and a special character.'}, status=400)

        # Verify OTP
        try:
            otp_record = OTPVerification.objects.get(email=email)
            if otp_record.otp.upper() != otp.upper():
                return JsonResponse({'success': False, 'error': 'Invalid OTP.'}, status=400)
            if otp_record.is_expired():
                return JsonResponse({'success': False, 'error': 'OTP expired. Please request a new one.'}, status=400)
        except OTPVerification.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'OTP not found. Please request an OTP first.'}, status=400)

        # Reset password
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'No account found with this email.'}, status=400)

        user.set_password(new_password)
        user.save()

        # Invalidate the used OTP
        otp_record.delete()

        return JsonResponse({'success': True, 'message': 'Password reset successfully. You can now log in.'})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    except Exception:
        logger.exception("Unexpected error in forgot_password_reset_api")
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'}, status=500)


# ─────────────────────────────────────────────
# TOTP Endpoints
# ─────────────────────────────────────────────

@require_GET
def totp_setup_api(request):
    """
    Generate a TOTP secret + QR code for the user currently in the login flow.
    Idempotent: Reuses existing secret if 2FA is not yet enabled.
    """
    user_id = request.session.get('pre_totp_user_id')
    if not user_id:
        return JsonResponse({'success': False, 'error': 'Session expired or not found. Please log in again.'}, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found.'}, status=404)

    profile, _ = UserProfile.objects.get_or_create(user=user)

    if profile.totp_enabled:
        return JsonResponse({'success': False, 'error': 'TOTP is already enabled.'}, status=400)

    # Reuse secret if not enabled yet to prevent StrictMode race conditions
    if not profile.totp_secret or not profile.totp_enabled:
        if not profile.totp_secret:
            profile.totp_secret = pyotp.random_base32()
        profile.totp_enabled = False
        profile.save()

    secret = profile.totp_secret

    # Build OTP Auth URI for QR
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=user.email or user.username,
        issuer_name='Hack!tUp'
    )

    # Generate QR code as base64 PNG
    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return JsonResponse({
        'success': True,
        'qr_code': f'data:image/png;base64,{qr_base64}',
        'secret': secret,
    })


@ratelimit(key='ip', rate='5/m', block=False)
@require_POST
def totp_enable_api(request):
    """
    Verify the first TOTP code and ENABLE 2FA permanently.
    Only then is the user fully logged in.
    """
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many attempts. Try again in 1 minute.'}, status=429)

    user_id = request.session.get('pre_totp_user_id')
    if not user_id:
        return JsonResponse({'success': False, 'error': 'Session expired. Please log in again.'}, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found.'}, status=404)

    try:
        data = json.loads(request.body)
        code = data.get('code', '').strip()

        if not code or len(code) != 6:
            return JsonResponse({'success': False, 'error': 'Invalid code format.'}, status=400)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        if not profile.totp_secret:
            return JsonResponse({'success': False, 'error': 'TOTP not set up.'}, status=400)

        totp = pyotp.TOTP(profile.totp_secret)
        if not totp.verify(code, valid_window=2):
            return JsonResponse({'success': False, 'error': 'Invalid code. Check your authenticator app.'}, status=400)

        # ── SUCCESS ──
        # Enable 2FA permanently
        profile.totp_enabled = True
        profile.save()

        # Perform the actual Django login now
        login(request, user)
        request.session['totp_verified'] = True
        if 'pre_totp_user_id' in request.session:
            del request.session['pre_totp_user_id']

        has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()
        assigned_event_id = None
        if has_admin_access and not user.is_staff and not user.is_superuser:
            first_role = EventRole.objects.filter(user=user).first()
            if first_role:
                assigned_event_id = first_role.event_id

        return JsonResponse({
            'success': True,
            'message': '2FA successfully enabled.',
            'user': {
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'has_admin_access': has_admin_access,
                'assigned_event_id': encode_id(assigned_event_id)
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    except Exception:
        logger.exception("Unexpected error in totp_enable_api")
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'}, status=500)


@require_POST
@ratelimit(key='ip', rate='5/m', block=False)
def totp_verify_api(request):
    """
    Verify a TOTP code during login.
    If valid, call login() to fully authenticate.
    """
    if getattr(request, 'limited', False):
        return JsonResponse({'success': False, 'error': 'Too many attempts. Try again in 1 minute.'}, status=429)

    user_id = request.session.get('pre_totp_user_id')
    if not user_id:
        return JsonResponse({'success': False, 'error': 'Session expired. Please log in again.'}, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found.'}, status=404)

    try:
        data = json.loads(request.body)
        code = data.get('code', '').strip()

        if not code or len(code) != 6:
            return JsonResponse({'success': False, 'error': 'Invalid code format.'}, status=400)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        if not profile.totp_enabled or not profile.totp_secret:
            return JsonResponse({'success': False, 'error': 'TOTP not configured.'}, status=400)

        totp = pyotp.TOTP(profile.totp_secret)
        if not totp.verify(code, valid_window=2):
            return JsonResponse({'success': False, 'error': 'Invalid code.'}, status=400)

        # ── SUCCESS ──
        login(request, user)
        request.session['totp_verified'] = True
        if 'pre_totp_user_id' in request.session:
            del request.session['pre_totp_user_id']

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

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    except Exception:
        logger.exception("Unexpected error in totp_verify_api")
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'}, status=500)

