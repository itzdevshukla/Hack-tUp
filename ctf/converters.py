from .utils import decode_id, encode_id

class HashIdConverter:
    # Hashids output is standard alphanumeric strings matching min_length 8
    regex = '[a-zA-Z0-9]{8,}'

    def to_python(self, value):
        decoded = decode_id(value)
        if decoded is None:
            raise ValueError
        return decoded

    def to_url(self, value):
        encoded = encode_id(value)
        if encoded is None:
            raise ValueError
        return encoded
