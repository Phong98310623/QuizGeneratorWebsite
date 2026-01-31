from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
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

# Đăng nhập (Sử dụng mặc định của SimpleJWT nhưng trả thêm thông tin user)
class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        user = User.objects(username=username).first()
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.data['user'] = UserSerializer(user).data
        return response