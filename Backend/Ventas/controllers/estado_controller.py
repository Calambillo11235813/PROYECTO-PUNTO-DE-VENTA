from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Estado
from Ventas.serializers import EstadoSerializer
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

class EstadoListCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        estados = Estado.objects.all()
        serializer = EstadoSerializer(estados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = EstadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstadoRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(Estado, pk=pk)

    def get(self, request, pk):
        estado = self.get_object(pk)
        serializer = EstadoSerializer(estado)
        return Response(serializer.data)

    def put(self, request, pk):
        estado = self.get_object(pk)
        serializer = EstadoSerializer(estado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        estado = self.get_object(pk)
        estado.delete()
        return Response({'mensaje': 'Estado eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
