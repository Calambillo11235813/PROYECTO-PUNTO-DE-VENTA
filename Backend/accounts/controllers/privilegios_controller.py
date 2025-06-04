from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Permisos
from accounts.serializers import PermisosSerializer
from django.shortcuts import get_object_or_404

class PermisosListCreate(APIView):
    def get(self, request):
        permisos = Permisos.objects.all()
        serializer = PermisosSerializer(permisos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PermisosSerializer(data=request.data)
        if serializer.is_valid():
            permiso = serializer.save()
            return Response(PermisosSerializer(permiso).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, permiso_id):
        """
        Actualiza un permiso existente
        
        Args:
            request: La solicitud HTTP
            permiso_id: ID del permiso a actualizar
            
        Returns:
            Response: El permiso actualizado o errores de validación
        """
        try:
            # Obtener el permiso existente
            permiso = get_object_or_404(Permisos, id=permiso_id)
            
            # Validar los datos de actualización
            serializer = PermisosSerializer(permiso, data=request.data, partial=True)
            
            if serializer.is_valid():
                # Guardar los cambios
                permiso_actualizado = serializer.save()
                
                # Devolver respuesta exitosa
                return Response({
                    "mensaje": "Permiso actualizado correctamente",
                    "permiso": PermisosSerializer(permiso_actualizado).data
                }, status=status.HTTP_200_OK)
            
            # Devolver errores de validación
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Manejar cualquier error inesperado
            return Response({
                "error": f"Error al actualizar el permiso: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
