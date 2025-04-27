from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from accounts.models import Usuario
from accounts.serializers import UsuarioSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    def post(self, request):
        correo = request.data.get("correo")
        contraseña = request.data.get("password")
        
        try:
            user = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(contraseña):
            return Response({"error": "Credenciales inválidas hola "}, status=status.HTTP_401_UNAUTHORIZED)

        from accounts.models import Bitacora

        Bitacora.objects.create(
            ip=request.META.get('REMOTE_ADDR'),
            accion="Inicio de sesión exitoso",
            usuario=user
        )

        refresh = RefreshToken.for_user(user)

        usuario_data = UsuarioSerializer(user).data

        empresa = user.empresa
        empresa_data = {
            "id": empresa.id,
            "nombre": empresa.nombre,
            "nit": empresa.nit,
            "estado": empresa.estado,
        }

        return Response({
            "mensaje": "Login exitoso",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
       
            "empresa": empresa_data
        }, status=status.HTTP_200_OK)