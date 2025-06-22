from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Privilegio
from accounts.serializers import PrivilegioSerializer
from django.shortcuts import get_object_or_404

class PrivilegioListCreate(APIView):
    def get(self, request):
        privilegios = Privilegio.objects.all()
        serializer = PrivilegioSerializer(privilegios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PrivilegioSerializer(data=request.data)
        if serializer.is_valid():
            privilegio = serializer.save()
            return Response(PrivilegioSerializer(privilegio).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, privilegio_id):
        """
        Actualiza un privilegio existente
        
        Args:
            request: La solicitud HTTP
            privilegio_id: ID del privilegio a actualizar
            
        Returns:
            Response: El privilegio actualizado o errores de validación
        """
        try:
            # Obtener el privilegio existente
            privilegio = get_object_or_404(Privilegio, id=privilegio_id)
            
            # Validar los datos de actualización
            serializer = PrivilegioSerializer(privilegio, data=request.data, partial=True)
            
            if serializer.is_valid():
                # Guardar los cambios
                privilegio_actualizado = serializer.save()
                
                # Devolver respuesta exitosa
                return Response({
                    "mensaje": "Privilegio actualizado correctamente",
                    "privilegio": PrivilegioSerializer(privilegio_actualizado).data
                }, status=status.HTTP_200_OK)
            
            # Devolver errores de validación
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Manejar cualquier error inesperado
            return Response({
                "error": f"Error al actualizar el privilegio: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
