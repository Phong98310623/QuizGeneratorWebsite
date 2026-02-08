from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .serializers import RegisterSerializer, AdminRegisterSerializer, UserSerializer
from .mongo_models import User


class DebugOrAuthenticated(permissions.BasePermission):
    """Permission class cho phép bypass authentication trong DEBUG mode để dễ debug"""
    def has_permission(self, request, view):
        # Trong DEBUG mode, cho phép truy cập không cần authentication
        if settings.DEBUG:
            print(f"[DebugOrAuthenticated] DEBUG mode enabled, bypassing authentication for {view.__class__.__name__}")
            return True
        # Ngoài DEBUG mode, yêu cầu authentication như bình thường
        is_authenticated = request.user and (
            hasattr(request.user, 'is_authenticated') and request.user.is_authenticated or
            hasattr(request.user, 'id')  # MongoDB User có id attribute
        )
        if not is_authenticated:
            print(f"[DebugOrAuthenticated] Authentication required but user not authenticated")
        return is_authenticated


class TokenUser:
    """Wrapper để tạo JWT cho MongoDB User"""
    def __init__(self, user):
        self.id = self.pk = str(user.pk)


# Đăng ký User thường
class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response(user_data, status=status.HTTP_201_CREATED)


# Đăng ký Admin/MOD (cần được duyệt)
class AdminRegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = AdminRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response({
            'message': 'Admin registration submitted. Your account is pending approval.',
            'user': user_data
        }, status=status.HTTP_201_CREATED)


# Đăng nhập - xác thực với MongoDB và tạo JWT (cho User thường)
class MyTokenObtainPairView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username') or ''
        password = request.data.get('password') or ''

        # Tìm user theo username hoặc email
        user = User.objects(username=username).first() or User.objects(email=username).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Kiểm tra status
        if user.status == 'BLOCKED':
            return Response({'detail': 'Account is blocked'}, status=status.HTTP_403_FORBIDDEN)

        # Cho phép tất cả role (USER, ADMIN, MOD) đăng nhập qua endpoint user
        # Tạo JWT tokens với user_id trong payload
        refresh = RefreshToken.for_user(TokenUser(user))
        refresh['user_id'] = str(user.id)
        refresh['username'] = user.username
        refresh['role'] = user.role
        
        access_token = refresh.access_token
        access_token['user_id'] = str(user.id)
        access_token['username'] = user.username
        access_token['role'] = user.role
        
        user_data = UserSerializer(user).data

        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
        })


# Đăng nhập Admin/MOD
class AdminLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username') or ''
        password = request.data.get('password') or ''

        # Tìm user theo username hoặc email
        user = User.objects(username=username).first() or User.objects(email=username).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Chỉ cho phép ADMIN và MOD đăng nhập
        if user.role not in ['ADMIN', 'MOD']:
            return Response({
                'detail': 'This endpoint is for admin/mod only. Please use regular login.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Kiểm tra status
        if user.status == 'BLOCKED':
            return Response({'detail': 'Account is blocked'}, status=status.HTTP_403_FORBIDDEN)

        if user.status == 'PENDING':
            return Response({
                'detail': 'Your account is pending approval. Please wait for admin approval.'
            }, status=status.HTTP_403_FORBIDDEN)

        if user.status != 'ACTIVE':
            return Response({
                'detail': 'Account is not active'
            }, status=status.HTTP_403_FORBIDDEN)

        # Tạo JWT tokens với user_id trong payload
        refresh = RefreshToken.for_user(TokenUser(user))
        refresh['user_id'] = str(user.id)
        refresh['username'] = user.username
        refresh['role'] = user.role
        
        access_token = refresh.access_token
        access_token['user_id'] = str(user.id)
        access_token['username'] = user.username
        access_token['role'] = user.role
        
        user_data = UserSerializer(user).data

        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
        })


# Duyệt Admin/MOD (chỉ ADMIN mới có quyền)
class AdminApproveView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        # Kiểm tra quyền - chỉ ADMIN mới có thể duyệt
        current_user = request.user
        if not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
            return Response({
                'detail': 'Only ADMIN can approve accounts'
            }, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        action = request.data.get('action')  # 'approve' or 'reject'

        if not user_id or not action:
            return Response({
                'detail': 'user_id and action (approve/reject) are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action not in ['approve', 'reject']:
            return Response({
                'detail': 'action must be "approve" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects(id=user_id).first()
            if not user:
                return Response({
                    'detail': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)

            if user.role not in ['ADMIN', 'MOD']:
                return Response({
                    'detail': 'Can only approve/reject ADMIN or MOD accounts'
                }, status=status.HTTP_400_BAD_REQUEST)

            if action == 'approve':
                user.status = 'ACTIVE'
                user.save()
                return Response({
                    'message': f'User {user.username} has been approved',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:  # reject
                user.status = 'BLOCKED'
                user.save()
                return Response({
                    'message': f'User {user.username} has been rejected',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'detail': f'Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Lấy danh sách Admin/MOD đang chờ duyệt
class PendingAdminListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Kiểm tra quyền - chỉ ADMIN mới có thể xem
        current_user = request.user
        if not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
            return Response({
                'detail': 'Only ADMIN can view pending accounts'
            }, status=status.HTTP_403_FORBIDDEN)

        pending_users = User.objects(role__in=['ADMIN', 'MOD'], status='PENDING')
        users_data = [UserSerializer(user).data for user in pending_users]

        return Response({
            'count': len(users_data),
            'users': users_data
        }, status=status.HTTP_200_OK)


# Lấy danh sách tất cả users (chỉ ADMIN)
class UserListView(APIView):
    permission_classes = (DebugOrAuthenticated,)

    def get(self, request):
        print(f"[UserListView] GET request received, DEBUG={settings.DEBUG}")
        
        # Trong DEBUG mode, bỏ qua kiểm tra authentication
        if not settings.DEBUG:
            # Kiểm tra quyền - chỉ ADMIN mới có thể xem
            current_user = request.user
            print(f"[UserListView] Current user: {current_user}, has role: {hasattr(current_user, 'role') if current_user else False}")
            if not current_user or not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
                return Response({
                    'detail': 'Only ADMIN can view all users'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            print(f"[UserListView] DEBUG mode: bypassing authentication check")

        # Lấy tất cả users
        try:
            all_users = User.objects.all().order_by('-created_at')
            users_data = [UserSerializer(user).data for user in all_users]
            print(f"[UserListView] Found {len(users_data)} users")
        except Exception as e:
            print(f"[UserListView] Error fetching users: {e}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'detail': f'Error fetching users: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'count': len(users_data),
            'users': users_data
        }, status=status.HTTP_200_OK)


# Cập nhật status của user (block/unblock)
class UserStatusUpdateView(APIView):
    permission_classes = (DebugOrAuthenticated,)

    def post(self, request):
        print(f"[UserStatusUpdateView] POST request received, DEBUG={settings.DEBUG}")
        
        # Trong DEBUG mode, bỏ qua kiểm tra authentication
        if not settings.DEBUG:
            # Kiểm tra quyền - chỉ ADMIN mới có thể cập nhật
            current_user = request.user
            print(f"[UserStatusUpdateView] Current user: {current_user}, has role: {hasattr(current_user, 'role') if current_user else False}")
            if not current_user or not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
                return Response({
                    'detail': 'Only ADMIN can update user status'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            print(f"[UserStatusUpdateView] DEBUG mode: bypassing authentication check")

        # Nhận email thay vì user_id
        user_email = request.data.get('email') or request.data.get('user_email')
        new_status = request.data.get('status')  # 'ACTIVE' or 'BLOCKED'
        reason = request.data.get('reason', '')  # Lý do block (optional)

        if not user_email or not new_status:
            return Response({
                'detail': 'email and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if new_status not in ['ACTIVE', 'BLOCKED']:
            return Response({
                'detail': 'status must be "ACTIVE" or "BLOCKED"'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(f"[UserStatusUpdateView] Updating user with email {user_email} to status {new_status}")
            # Tìm user theo email
            user = User.objects(email=user_email).first()
            if not user:
                return Response({
                    'detail': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)

            user.status = new_status
            user.save()
            print(f"[UserStatusUpdateView] Successfully updated user {user.username} ({user.email}) to {new_status}")
            if reason:
                print(f"[UserStatusUpdateView] Block reason: {reason}")
            
            return Response({
                'message': f'User {user.username} status updated to {new_status}',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[UserStatusUpdateView] Error updating user status: {e}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'detail': f'Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Verify token và lấy thông tin user hiện tại
class VerifyTokenView(APIView):
    permission_classes = (DebugOrAuthenticated,)

    def get(self, request):
        """Verify token và trả về thông tin user hiện tại"""
        print("[VerifyTokenView] GET request received")
        print(f"[VerifyTokenView] DEBUG mode: {settings.DEBUG}")
        print(f"[VerifyTokenView] Request headers: {dict(request.headers)}")
        print(f"[VerifyTokenView] Authorization header: {request.headers.get('Authorization', 'Not found')}")
        
        # Trong DEBUG mode, trả về mock user để test
        if settings.DEBUG and not request.user:
            print("[VerifyTokenView] DEBUG mode: returning mock admin user")
            # Tìm một admin user thực tế hoặc trả về mock data
            try:
                admin_user = User.objects(role='ADMIN', status='ACTIVE').first()
                if admin_user:
                    return Response({
                        'valid': True,
                        'user': UserSerializer(admin_user).data
                    }, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"[VerifyTokenView] Error finding admin user in DEBUG mode: {e}")
        
        try:
            current_user = request.user
            print(f"[VerifyTokenView] request.user type: {type(current_user)}")
            print(f"[VerifyTokenView] request.user: {current_user}")
            print(f"[VerifyTokenView] request.user attributes: {dir(current_user) if current_user else 'None'}")
            
            # Kiểm tra xem user có tồn tại không
            if not current_user:
                print("[VerifyTokenView] ERROR: User not found in request")
                return Response({
                    'valid': False,
                    'error': 'User not found in request'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Kiểm tra user có phải là MongoDB User không
            if not hasattr(current_user, 'id'):
                print(f"[VerifyTokenView] ERROR: Invalid user object, type: {type(current_user)}")
                print(f"[VerifyTokenView] User attributes: {dir(current_user)}")
                return Response({
                    'valid': False,
                    'error': 'Invalid user object',
                    'user_type': str(type(current_user)),
                    'user_attrs': [attr for attr in dir(current_user) if not attr.startswith('_')]
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            print(f"[VerifyTokenView] User ID: {current_user.id}")
            print(f"[VerifyTokenView] User has role attr: {hasattr(current_user, 'role')}")
            
            # Kiểm tra user có phải là ADMIN hoặc MOD không
            if not hasattr(current_user, 'role'):
                print(f"[VerifyTokenView] ERROR: User does not have 'role' attribute")
                return Response({
                    'valid': False,
                    'error': 'User object missing role attribute',
                    'user_type': str(type(current_user))
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            user_role = current_user.role
            if user_role not in ['ADMIN', 'MOD']:
                print(f"[VerifyTokenView] ERROR: User role '{user_role}' is not ADMIN/MOD")
                return Response({
                    'valid': False,
                    'error': 'This endpoint is for ADMIN/MOD only',
                    'user_role': user_role
                }, status=status.HTTP_403_FORBIDDEN)
            
            print(f"[VerifyTokenView] User role: {current_user.role}, status: {current_user.status}")
            
            # Serialize user data
            try:
                user_data = UserSerializer(current_user).data
                print(f"[VerifyTokenView] Serialized user data: {user_data}")
            except Exception as ser_e:
                print(f"[VerifyTokenView] ERROR serializing user: {ser_e}")
                import traceback
                print(traceback.format_exc())
                return Response({
                    'valid': False,
                    'error': f'Error serializing user: {str(ser_e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'valid': True,
                'user': user_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"[VerifyTokenView] EXCEPTION: {str(e)}")
            print(f"[VerifyTokenView] Exception type: {type(e)}")
            print(f"[VerifyTokenView] Traceback: {error_traceback}")
            return Response({
                'valid': False,
                'error': str(e),
                'error_type': str(type(e)),
                'traceback': error_traceback if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
