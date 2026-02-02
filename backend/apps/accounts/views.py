from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from .serializers import RegisterSerializer, UserSerializer
from .mongo_models import User, AuthToken

# Đăng ký
class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response(user_data, status=status.HTTP_201_CREATED)

# Đăng nhập (Custom implementation for MongoDB)
class MyTokenObtainPairView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects(username=username).first()
        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens manually for MongoDB user
        try:
            refresh = RefreshToken()
            refresh['user_id'] = str(user.id)
            refresh['username'] = user.username
            
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Get client IP
            ip_address = self.get_client_ip(request)
            
            # Calculate expiry time (usually 24 hours from now)
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            # Save token to auth_tokens collection
            auth_token = AuthToken(
                user_id=user.id,
                access_token=access_token,
                refresh_token=refresh_token,
                ip_address=ip_address,
                expires_at=expires_at,
                revoked=False
            )
            auth_token.save()
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Token generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )