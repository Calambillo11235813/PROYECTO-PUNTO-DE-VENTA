from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
#from rest_framework.permissions import IsAuthenticated
from accounts.models import Empleado, Rol
from accounts.serializers import EmpleadoSerializer
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from backend.permisos import requiere_permiso 


class EmpleadoListCreate(APIView):
    
    # @requiere_permiso("ver_empleados") 
    def get(self, request, usuario_id):
        empleados = Empleado.objects.filter(usuario_id=usuario_id)
        serializer = EmpleadoSerializer(empleados, many=True)
        return Response(serializer.data)
    
    
    
    def post(self, request, usuario_id):
        # Extraer el ID o nombre del rol desde el JSON
        rol_info = request.data.get('rol', None)
        
        if rol_info:
            try:
                # Intentar primero como ID (puede venir como string)
                try:
                    rol_id = int(rol_info)
                    rol = Rol.objects.get(id=rol_id)
                except (ValueError, TypeError):
                    # Si no es un ID válido, intentar como nombre
                    rol = Rol.objects.get(nombre_rol=rol_info)
                    
            except Rol.DoesNotExist:
                return Response({"error": f"Rol con ID/nombre '{rol_info}' no encontrado"}, status=status.HTTP_400_BAD_REQUEST)
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
            "telefono": request.data.get("telefono"),
            "fecha_contratacion": request.data.get("fecha_contratacion"),
            "rol": rol.id if rol else None,
            "password": password_encriptada,
        }
        serializer = EmpleadoSerializer(data=data)
        if serializer.is_valid():
            empleado = serializer.save()
            return Response(EmpleadoSerializer(empleado).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmpleadoDetail(APIView):
    def get_object(self, usuario_id, pk):
        return get_object_or_404(Empleado, pk=pk, usuario_id=usuario_id)

    def put(self, request, usuario_id, pk):
        empleado = self.get_object(usuario_id, pk)

        rol_info = request.data.get('rol', None)
        if rol_info:
            try:
                # Intentar primero como ID (puede venir como string)
                try:
                    rol_id = int(rol_info)
                    rol = Rol.objects.get(id=rol_id)
                except (ValueError, TypeError):
                    # Si no es un ID válido, intentar como nombre
                    rol = Rol.objects.get(nombre_rol=rol_info)
                    
            except Rol.DoesNotExist:
                return Response({"error": f"Rol con ID/nombre '{rol_info}' no encontrado"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rol = None

        password = request.data.get("password")
        password_encriptada = make_password(password) if password else empleado.password

        data = {
            "usuario": usuario_id,
            "nombre": request.data.get("nombre", empleado.nombre),
            "correo": request.data.get("correo", empleado.correo),
            "telefono": request.data.get("telefono", empleado.telefono),
            "direccion": request.data.get("direccion", empleado.direccion),
            "fecha_contratacion": request.data.get("fecha_contratacion", empleado.fecha_contratacion),
            "estado": request.data.get("estado", empleado.estado),
            "rol": rol.id if rol else (empleado.rol.id if empleado.rol else None),
            "password": password_encriptada
        }

        serializer = EmpleadoSerializer(empleado, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, usuario_id, pk):
        empleado = self.get_object(usuario_id, pk)
        empleado.delete()
        return Response({"mensaje": "Empleado eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)

class EmpleadoDetailSimple(APIView):
    """
    Permite obtener, actualizar o eliminar un empleado usando solo su ID, 
    sin necesidad de especificar el ID de usuario.
    """
    def get_object(self, pk):
        # Solo busca por PK, sin filtrar por usuario_id
        return get_object_or_404(Empleado, pk=pk)
    
    def get(self, request, pk):
        empleado = self.get_object(pk)
        serializer = EmpleadoSerializer(empleado)
        return Response(serializer.data)
    
    def put(self, request, pk):
        empleado = self.get_object(pk)

        rol_info = request.data.get('rol', None)
        if rol_info:
            try:
                # Intentar primero como ID (puede venir como string)
                try:
                    rol_id = int(rol_info)
                    rol = Rol.objects.get(id=rol_id)
                except (ValueError, TypeError):
                    # Si no es un ID válido, intentar como nombre
                    rol = Rol.objects.get(nombre_rol=rol_info)
                    
            except Rol.DoesNotExist:
                return Response({"error": f"Rol con ID/nombre '{rol_info}' no encontrado"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rol = None

        password = request.data.get("password")
        password_encriptada = make_password(password) if password else empleado.password

        data = {
            "usuario": empleado.usuario.id,  # Mantiene el usuario actual
            "nombre": request.data.get("nombre", empleado.nombre),
            "correo": request.data.get("correo", empleado.correo),
            "telefono": request.data.get("telefono", empleado.telefono),
            "direccion": request.data.get("direccion", empleado.direccion),
            "fecha_contratacion": request.data.get("fecha_contratacion", empleado.fecha_contratacion),
            "estado": request.data.get("estado", empleado.estado),
            "rol": rol.id if rol else (empleado.rol.id if empleado.rol else None),
            "password": password_encriptada
        }

        serializer = EmpleadoSerializer(empleado, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        empleado = self.get_object(pk)
        empleado.delete()
        return Response({"mensaje": "Empleado eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)