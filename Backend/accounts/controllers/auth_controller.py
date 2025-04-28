from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from accounts.models import Usuario, Bitacora
from accounts.serializers import UsuarioSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
class LoginView(APIView):
    permission_classes = [AllowAny]  # Esto es crucial
    
    
    def post(self, request):
        correo = request.data.get("correo")

        contraseña = request.data.get("password")
        



        try:
            user = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


        if not user.check_password(contraseña):
            return Response({"error": "Credenciales inválidas hola "}, status=status.HTTP_401_UNAUTHORIZED)

        # Verificar contraseña
      
        # Verificar si el usuario está activo
        if not user.estado:
            return Response({"error": "Usuario inactivo"}, status=status.HTTP_403_FORBIDDEN)


        # Registrar en bitácora
        Bitacora.objects.create(
            ip=request.META.get('REMOTE_ADDR'),
            accion="Inicio de sesión exitoso",
            usuario=user
        )

        # Generar tokens
        refresh = RefreshToken.for_user(user)

        # Obtener datos del usuario
        usuario_data = UsuarioSerializer(user).data

        # Obtener datos de la empresa
        empresa_data = None
        if user.empresa:
            empresa_data = {
                "id": user.empresa.id,
                "nombre": user.empresa.nombre,
                "nit": user.empresa.nit,
                "estado": user.empresa.estado,
            }

        # Obtener datos del rol
        rol_data = None
        if user.rol:
            rol_data = {
                "id": user.rol.id,
                "nombre": user.rol.nombre_rol,
            }

        # Preparar respuesta
        return Response({
            "mensaje": "Login exitoso",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "usuario": {
                "id": user.id,
                "nombre": user.nombre,
                "correo": user.correo,
                "rol": rol_data
            },
            "empresa": empresa_data
        }, status=status.HTTP_200_OK)