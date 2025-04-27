from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Estado
from Ventas.serializers import EstadoSerializer
from accounts.models import Empresa

class EstadoListCreateAPIView(APIView):
    def get(self, request):
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa_id en los parámetros de la URL'}, status=status.HTTP_400_BAD_REQUEST)

        estados = Estado.objects.filter(empresa_id=empresa_id)
        serializer = EstadoSerializer(estados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        empresa_id = request.data.get('empresa')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa en el body'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EstadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EstadoRetrieveUpdateDestroyAPIView(APIView):
    def get_object(self, pk, empresa_id):
        try:
            return Estado.objects.get(pk=pk, empresa_id=empresa_id)
        except Estado.DoesNotExist:
            return None

    def get(self, request, pk):
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa_id en los parámetros de la URL'}, status=status.HTTP_400_BAD_REQUEST)

        estado = self.get_object(pk, empresa_id)
        if not estado:
            return Response({'error': 'Estado no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EstadoSerializer(estado)
        return Response(serializer.data)

    def put(self, request, pk):
        empresa_id = request.data.get('empresa')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa en el body'}, status=status.HTTP_400_BAD_REQUEST)

        estado = self.get_object(pk, empresa_id)
        if not estado:
            return Response({'error': 'Estado no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EstadoSerializer(estado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa_id en los parámetros de la URL'}, status=status.HTTP_400_BAD_REQUEST)

        estado = self.get_object(pk, empresa_id)
        if not estado:
            return Response({'error': 'Estado no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        estado.delete()
        return Response({'mensaje': 'Estado eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
