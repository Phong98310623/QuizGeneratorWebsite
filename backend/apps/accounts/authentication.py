"""JWT Authentication cho MongoDB User"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.conf import settings
from .mongo_models import User


class MongoJWTAuthentication(JWTAuthentication):
    """Xác thực JWT và lấy User từ MongoDB thay vì Django User"""

    def get_user(self, validated_token):
        print("[MongoJWTAuthentication] get_user called")
        print(f"[MongoJWTAuthentication] validated_token type: {type(validated_token)}")
        
        try:
            # SimpleJWT khi dùng RefreshToken.for_user() sẽ tự động thêm user_id
            # Nhưng nó có thể lưu dưới key 'user_id' hoặc có thể là key khác
            # Chúng ta đã thêm 'user_id' vào token trong views.py
            
            # Debug: In ra toàn bộ token payload
            print(f"[MongoJWTAuthentication] Full token payload: {dict(validated_token)}")
            print(f"[MongoJWTAuthentication] Token payload keys: {list(validated_token.keys())}")
            
            # Thử lấy user_id từ nhiều nguồn khác nhau
            user_id = None
            
            # 1. Thử lấy từ custom field 'user_id' mà chúng ta đã thêm
            if 'user_id' in validated_token:
                user_id = validated_token['user_id']
                print(f"[MongoJWTAuthentication] Found user_id from 'user_id' key: {user_id}")
            
            # 2. Nếu không có, thử lấy từ token_type (SimpleJWT default)
            if not user_id:
                # SimpleJWT có thể lưu user_id trong token dựa trên TokenUser.id
                # Khi dùng RefreshToken.for_user(TokenUser(user)), nó sẽ lưu TokenUser.id
                # TokenUser.id = str(user.pk), nên có thể tìm bằng cách khác
                for key in ['user', 'id', 'sub']:
                    if key in validated_token:
                        user_id = validated_token[key]
                        print(f"[MongoJWTAuthentication] Found user_id from '{key}' key: {user_id}")
                        break
            
            print(f"[MongoJWTAuthentication] Final user_id: {user_id} (type: {type(user_id)})")
            
            if not user_id:
                available_keys = list(validated_token.keys())
                error_msg = f'Token does not contain user_id. Available keys: {available_keys}'
                print(f"[MongoJWTAuthentication] ERROR: {error_msg}")
                raise InvalidToken(error_msg)
            
            # Convert string to ObjectId nếu cần
            from bson import ObjectId
            original_user_id = user_id
            
            # Đảm bảo MongoDB đã được connect
            import mongoengine as me
            from django.conf import settings
            try:
                # Kiểm tra xem MongoDB đã được connect chưa
                try:
                    db = me.connection.get_db()
                    print(f"[MongoJWTAuthentication] MongoDB connection check: {db is not None}")
                except:
                    print("[MongoJWTAuthentication] MongoDB not connected, attempting to connect...")
                    mongodb_config = settings.MONGODB_DATABASES['default']
                    me.connect(
                        db=mongodb_config['name'],
                        host=mongodb_config['host'],
                        connectTimeoutMS=30000,
                        serverSelectionTimeoutMS=30000,
                    )
                    print("[MongoJWTAuthentication] MongoDB connected")
            except Exception as conn_e:
                print(f"[MongoJWTAuthentication] MongoDB connection check failed: {conn_e}")
                import traceback
                print(traceback.format_exc())
                # Tiếp tục thử tìm user, có thể connection đã tồn tại
            
            # Tìm user trong MongoDB (thử cả ObjectId và string)
            user = None
            try:
                print(f"[MongoJWTAuthentication] Attempting to find user with id: {user_id}")
                
                # Thử convert sang ObjectId nếu là string
                if isinstance(user_id, str):
                    print(f"[MongoJWTAuthentication] user_id is string, trying ObjectId conversion...")
                    try:
                        user_id_obj = ObjectId(user_id)
                        print(f"[MongoJWTAuthentication] Converted to ObjectId: {user_id_obj}")
                        user = User.objects(id=user_id_obj).first()
                        print(f"[MongoJWTAuthentication] User found with ObjectId: {user is not None}")
                        if user:
                            print(f"[MongoJWTAuthentication] User details: username={user.username}, role={user.role}")
                    except Exception as obj_e:
                        print(f"[MongoJWTAuthentication] ObjectId conversion failed: {obj_e}, trying string search...")
                        # Nếu không phải ObjectId format, thử tìm bằng string
                        try:
                            user = User.objects(id=user_id).first()
                            print(f"[MongoJWTAuthentication] User found with string id: {user is not None}")
                        except Exception as str_e:
                            print(f"[MongoJWTAuthentication] String search failed: {str_e}")
                else:
                    print(f"[MongoJWTAuthentication] user_id is not string, searching directly...")
                    user = User.objects(id=user_id).first()
                    print(f"[MongoJWTAuthentication] User found: {user is not None}")
                
                # Nếu vẫn không tìm thấy, thử tìm bằng username (fallback)
                if not user and isinstance(original_user_id, str):
                    print(f"[MongoJWTAuthentication] User not found by id, trying username: {original_user_id}")
                    try:
                        user = User.objects(username=original_user_id).first()
                        print(f"[MongoJWTAuthentication] User found by username: {user is not None}")
                    except Exception as username_e:
                        print(f"[MongoJWTAuthentication] Username search failed: {username_e}")
                    
            except Exception as e:
                print(f"[MongoJWTAuthentication] ERROR finding user: {e}")
                import traceback
                print(traceback.format_exc())
                # Re-raise để xem lỗi gốc
                raise
            
            if user is None:
                error_msg = f'User not found with id: {original_user_id}'
                print(f"[MongoJWTAuthentication] ERROR: {error_msg}")
                raise InvalidToken(error_msg)
            
            print(f"[MongoJWTAuthentication] User found: {user.username} (role: {user.role}, status: {user.status})")
            
            # Kiểm tra user status
            if user.status == 'BLOCKED':
                raise AuthenticationFailed('User account is blocked')
            
            if user.status == 'PENDING' and user.role in ['ADMIN', 'MOD']:
                raise AuthenticationFailed('User account is pending approval')
            
            return user
        except (InvalidToken, AuthenticationFailed):
            raise
        except Exception as e:
            import traceback
            if settings.DEBUG:
                print(f"[DEBUG] Authentication error: {str(e)}")
                print(traceback.format_exc())
            raise InvalidToken(f'Invalid token: {str(e)}')
