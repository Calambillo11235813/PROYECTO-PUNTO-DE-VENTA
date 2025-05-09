from django.urls import path
from accounts.controllers.auth_controller import LoginView
from accounts.controllers.usuarios_controller import UsuarioListCreate, UsuarioDetail
from accounts.controllers.empleados_controller import EmpleadoListCreate
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.controllers.bitacora_controller import BitacoraCreate
from accounts.controllers.rol_controller import RolListCreate
from accounts.controllers.empleados_controller import EmpleadoListCreate, EmpleadoDetail
from accounts.controllers.privilegios_controller import PrivilegioListCreate
from accounts.controllers.permisos_controller import RolPrivilegiosView
urlpatterns = [
    # Autenticación
    path('login/', LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Usuario (APIView)
    path('usuarios/', UsuarioListCreate.as_view(), name='usuarios-list-create'),
    path('usuarios/<int:pk>/', UsuarioDetail.as_view(), name='usuarios-detail'),
    path('bitacora/', BitacoraCreate.as_view(), name='bitacora-create'),
    path('empleados/<int:usuario_id>/', EmpleadoListCreate.as_view(), name='empleados-list-create'),
    path('roles/', RolListCreate.as_view(), name='roles-list-create'),
    path('empleado/<int:usuario_id>/<int:pk>/', EmpleadoDetail.as_view(), name='empleado-detail'),
    path('privilegios/', PrivilegioListCreate.as_view(), name='privilegios'),
    path('roles/<int:rol_id>/privilegios/', RolPrivilegiosView.as_view(), name='rol-privilegios'),

]
