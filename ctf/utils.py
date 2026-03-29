from hashids import Hashids
from django.conf import settings
import random
import string
from django.core.mail import send_mail

# Initialize Hashids with Django secret key for uniqueness across deployments
hashids = Hashids(salt=settings.SECRET_KEY, min_length=8)

def encode_id(id_val):
    if id_val is None:
        return None
    try:
        id_val = int(id_val)
        return hashids.encode(id_val)
    except (ValueError, TypeError):
        return None

def decode_id(hash_str):
    if not hash_str:
        return None
    try:
        decoded = hashids.decode(hash_str)
        if decoded:
            return decoded[0]
        return None
    except Exception:
        return None

from django.template.loader import render_to_string
from django.utils.html import strip_tags

def generate_otp(length=6):
    """Generate a random alphanumeric OTP."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=length))

def send_otp_email(email, otp):
    """Send OTP to the user's email using a premium HTML template."""
    subject = "Welcome to Hack!tUp - OnBoarding OTP"
    context = {'otp': otp}
    html_message = render_to_string('emails/otp_email.html', context)
    plain_message = strip_tags(html_message)
    from_email = settings.DEFAULT_FROM_EMAIL
    
    send_mail(
        subject,
        plain_message,
        from_email,
        [email],
        html_message=html_message
    )


def send_reset_password_email(email, otp):
    """Send password reset OTP using a separate red-themed email template."""
    subject = "Password Reset Request - Hack!tup"
    context = {'otp': otp}
    html_message = render_to_string('emails/reset_password_email.html', context)
    plain_message = strip_tags(html_message)
    from_email = settings.DEFAULT_FROM_EMAIL

    send_mail(
        subject,
        plain_message,
        from_email,
        [email],
        html_message=html_message
    )
