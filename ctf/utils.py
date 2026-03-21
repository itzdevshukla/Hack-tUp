from hashids import Hashids
from django.conf import settings

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
