from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer
from .mongo_models import User


class TokenUser:
    """Wrapper để tạo JWT cho MongoDB User"""
    def __init__(self, user):
        self.id = self.pk = str(user.pk)


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


# Đăng nhập - xác thực với MongoDB và tạo JWT
class MyTokenObtainPairView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username') or ''
        password = request.data.get('password') or ''

        # Tìm user theo username hoặc email
        user = User.objects(username=username).first() or User.objects(email=username).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status == 'BLOCKED':
            return Response({'detail': 'Account is blocked'}, status=status.HTTP_403_FORBIDDEN)

        # Tạo JWT tokens
        refresh = RefreshToken.for_user(TokenUser(user))
        user_data = UserSerializer(user).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        })