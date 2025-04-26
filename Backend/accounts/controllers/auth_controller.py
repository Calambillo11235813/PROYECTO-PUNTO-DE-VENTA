from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from accounts.models import Usuario
from accounts.serializers import UsuarioSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    def post(self, request):
        correo = request.data.get("correo")
        contraseña = request.data.get("contraseña")
        empresa_id = request.data.get("empresa_id")

        user = authenticate(request, username=correo, password=contraseña)

        if user is not None and str(user.empresa.id) == str(empresa_id):
            from accounts.models import Bitacora

            Bitacora.objects.create(
                ip=request.META.get('REMOTE_ADDR'),
                accion="Inicio de sesión exitoso",
                usuario=user
            )
            refresh = RefreshToken.for_user(user)
            return Response({
                "mensaje": "Login exitoso",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response({"error": "Credenciales inválidas o empresa incorrecta"}, status=status.HTTP_401_UNAUTHORIZED)
