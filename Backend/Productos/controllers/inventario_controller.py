from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Inventario
from Productos.serializers import InventarioSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

class InventarioListaCrearVista(APIView):
    def get(self, request):
        """
        Listar todos los inventarios (GET)
        """
        inventarios = Inventario.objects.all()
        serializer = InventarioSerializer(inventarios, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Crear nuevo inventario (POST)
        """
        serializer = InventarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InventarioDetalleVista(APIView):
    def get(self, request, pk):
        """
        Obtener inventario por ID (GET)
        """
        inventario = get_object_or_404(Inventario, pk=pk)
        serializer = InventarioSerializer(inventario)
        return Response(serializer.data)

    def put(self, request, pk):
        """
        Actualizar inventario por ID (PUT)
        """
        inventario = get_object_or_404(Inventario, pk=pk)
        serializer = InventarioSerializer(inventario, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Eliminar inventario por ID (DELETE)
        """
        inventario = get_object_or_404(Inventario, pk=pk)
        inventario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
class filtarInventario(APIView):
   

