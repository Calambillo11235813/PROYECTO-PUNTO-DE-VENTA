from django.urls import path
from accounts.controllers.auth_controller import LoginView
from accounts.controllers.usuarios_controller import UsuarioListCreate, UsuarioDetail
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.controllers.bitacora_controller import BitacoraCreate

urlpatterns = [
    # Autenticación
    path('login/', LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Usuario (APIView)
    path('usuarios/', UsuarioListCreate.as_view(), name='usuarios-list-create'),
    path('usuarios/<int:pk>/', UsuarioDetail.as_view(), name='usuarios-detail'),
    path('bitacora/', BitacoraCreate.as_view(), name='bitacora-create'),
]
