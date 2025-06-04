from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Rol, Permisos
from accounts.serializers import PermisosSerializer
from django.shortcuts import get_object_or_404

class PermisosListCreate(APIView):
    def get(self, request, permiso_id=None):
        """
        Obtiene la lista de todos los permisos o un permiso específico
        
        Parámetros opcionales:
        - permiso_id: ID del permiso específico a consultar
        
        Retorna:
        - Lista de todos los permisos si no se proporciona permiso_id
        - Detalle de un permiso específico si se proporciona permiso_id
        - 404 si el permiso específico no existe
        """
        try:
            if permiso_id:
                # Obtener un permiso específico
                permiso = get_object_or_404(Permisos, id=permiso_id)
                serializer = PermisosSerializer(permiso)
                return Response(serializer.data)
            else:
                # Obtener todos los permisos
                permisos = Permisos.objects.all()
                serializer = PermisosSerializer(permisos, many=True)
                return Response(serializer.data)
        except Exception as e:
            return Response({
                "error": f"Error al obtener permisos: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Crea un nuevo permiso en el sistema.
        
        Datos requeridos:
        - nombre: Nombre único del permiso (obligatorio)
        - descripcion: Descripción del permiso (opcional)
        
        Retorna:
        - El permiso creado en formato JSON
        - Código HTTP 201 Created si es exitoso
        - Errores de validación si los datos son inválidos
        """
        try:
            serializer = PermisosSerializer(data=request.data)
            if serializer.is_valid():
                permiso = serializer.save()
                return Response({
                    "mensaje": "Permiso creado correctamente",
                    "permiso": serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "error": f"Error al crear el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, permiso_id):
        """
        Actualiza un permiso existente.
        
        Parámetros:
        - permiso_id: ID del permiso a actualizar
        
        Datos modificables:
        - nombre: Nombre del permiso
        - descripcion: Descripción del permiso
        
        Retorna:
        - El permiso actualizado en formato JSON
        - Errores de validación si los datos son inválidos
        - 404 si el permiso no existe
        """
        try:
            permiso = get_object_or_404(Permisos, id=permiso_id)
            serializer = PermisosSerializer(permiso, data=request.data, partial=True)
            
            if serializer.is_valid():
                permiso_actualizado = serializer.save()
                return Response({
                    "mensaje": "Permiso actualizado correctamente",
                    "permiso": serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                "error": f"Error al actualizar el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, permiso_id):
        """
        Elimina un permiso existente.
        
        Parámetros:
        - permiso_id: ID del permiso a eliminar
        
        Retorna:
        - 204 No Content si la eliminación es exitosa
        - 404 si el permiso no existe
        - 400 si el permiso está siendo utilizado por roles
        """
        try:
            permiso = get_object_or_404(Permisos, id=permiso_id)
            
            # Verificar si el permiso está siendo utilizado por algún rol
            roles_con_permiso = permiso.roles.all()
            if roles_con_permiso.exists():
                return Response({
                    "error": "No se puede eliminar el permiso porque está siendo utilizado por roles",
                    "roles": [rol.nombre_rol for rol in roles_con_permiso]
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Eliminar el permiso si no está siendo utilizado
            permiso.delete()
            return Response({
                "mensaje": "Permiso eliminado correctamente"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Error al eliminar el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

