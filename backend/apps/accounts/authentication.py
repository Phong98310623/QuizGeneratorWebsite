"""JWT Authentication cho MongoDB User"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .mongo_models import User


class MongoJWTAuthentication(JWTAuthentication):
    """Xác thực JWT và lấy User từ MongoDB thay vì Django User"""

    def get_user(self, validated_token):
        try:
            user_id = validated_token.get('user_id')
            user = User.objects(id=user_id).first()
            if user is None:
                raise InvalidToken('User not found')
            return user
        except Exception:
            raise InvalidToken('Invalid token')
