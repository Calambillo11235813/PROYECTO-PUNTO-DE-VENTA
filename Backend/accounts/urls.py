from django.urls import path
from accounts.controllers.auth_controller import LoginView
from accounts.controllers.usuarios_controller import UsuarioListCreate, UsuarioDetail, ClienteListAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.controllers.bitacora_controller import BitacoraCreate
from accounts.controllers.register_controller import RegisterView

urlpatterns = [
    # Autenticación
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),  # Nueva URL
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Usuario (APIView)
    path('usuarios/', UsuarioListCreate.as_view(), name='usuarios-list-create'),
    path('usuarios/<int:pk>/', UsuarioDetail.as_view(), name='usuarios-detail'),
    path('bitacora/', BitacoraCreate.as_view(), name='bitacora-create'),
    path('usuarios/clientes/<int:empresa_id>/', ClienteListAPIView.as_view(), name='clientes-list'),

]
