from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import login
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
import  logging 
logger = logging.getLogger('bitacora')

from accounts.models import Usuario, Empleado, Bitacora
from accounts.serializers import UsuarioSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        correo = request.data.get("correo")
        contraseña = request.data.get("password")
        ip = request.META.get("REMOTE_ADDR", "IP desconocida")

        # Intentar login como Usuario
        try:
            user = Usuario.objects.get(correo=correo)

            if not user.check_password(contraseña):
                raise ValueError("Contraseña incorrecta")

            if not user.estado:
                return Response({"error": "Usuario inactivo"}, status=status.HTTP_403_FORBIDDEN)

            logger.info(f"Usuario: {user.correo} | Acción: Inicio de sesión exitoso | IP: {ip}")

            # JWT tokens
            refresh = RefreshToken.for_user(user)
            usuario_data = UsuarioSerializer(user).data

            return Response({
                "mensaje": "Login exitoso (usuario)",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "usuario": usuario_data,
                "tipo": "usuario"
            }, status=status.HTTP_200_OK)

        except (Usuario.DoesNotExist, ValueError):
            pass  # Intentamos login como empleado

        # Intentar login como Empleado
        try:
            empleado = Empleado.objects.get(correo=correo)

            if not check_password(contraseña, empleado.password):
                return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

            if not empleado.estado:
                return Response({"error": "Empleado inactivo"}, status=status.HTTP_403_FORBIDDEN)
            
            logger.info(f"Empleado: {empleado.correo} | Acción: Inicio de sesión exitoso | IP: {ip}")

            # Login exitoso (sin token JWT)
            return Response({
                "mensaje": "Login exitoso (empleado)",
                "empleado": {
                    "id": empleado.id,
                    "nombre": empleado.nombre,
                    "correo": empleado.correo,
                    "rol": empleado.rol.nombre_rol if empleado.rol else None
                },
                "tipo": "empleado"
            }, status=status.HTTP_200_OK)

        except Empleado.DoesNotExist:
            logger.warning(f"Intento de login fallido | Correo: {correo} | IP: {ip}")
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
