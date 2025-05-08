from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
#from rest_framework.permissions import IsAuthenticated
from accounts.models import Empleado, Rol
from accounts.serializers import EmpleadoSerializer
from django.contrib.auth.hashers import make_password

class EmpleadoListCreate(APIView):
    def get(self, request, usuario_id):
        empleados = Empleado.objects.filter(usuario_id=usuario_id)
        serializer = EmpleadoSerializer(empleados, many=True)
        return Response(serializer.data)

    def post(self, request, usuario_id):
        # Extraer el nombre del rol desde el JSON
        rol_nombre = request.data.get('rol', None)
        if rol_nombre:
            try:
                rol = Rol.objects.get(nombre_rol=rol_nombre)
            except Rol.DoesNotExist:
                return Response({"error": "Rol no encontrado"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rol = None
        
        password = request.data.get("password")
        password_encriptada = make_password(password) if password else None

        # Construimos manualmente el diccionario limpio
        data = {
            "usuario": usuario_id,
            "nombre": request.data.get("nombre"),
            "correo": request.data.get("correo"),
            "direccion": request.data.get("direccion"),
            "fecha_contratacion": request.data.get("fecha_contratacion"),
            "rol": rol.id if rol else None,
            "password": password_encriptada,
        }

        serializer = EmpleadoSerializer(data=data)
        if serializer.is_valid():
            empleado = serializer.save()
            return Response(EmpleadoSerializer(empleado).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)