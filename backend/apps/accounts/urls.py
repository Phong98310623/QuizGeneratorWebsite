from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    AdminRegisterView,
    MyTokenObtainPairView,
    AdminLoginView,
    AdminApproveView,
    PendingAdminListView,
    VerifyTokenView
)

urlpatterns = [
    # User endpoints
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin endpoints
    path('admin/register/', AdminRegisterView.as_view(), name='admin_register'),
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin/pending/', PendingAdminListView.as_view(), name='admin_pending_list'),
    path('admin/approve/', AdminApproveView.as_view(), name='admin_approve'),
    path('admin/verify-token/', VerifyTokenView.as_view(), name='admin_verify_token'),
]