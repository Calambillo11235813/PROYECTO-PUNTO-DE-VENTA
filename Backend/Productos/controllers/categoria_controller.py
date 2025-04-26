from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Categoria
from Productos.serializers import CategoriaSerializer
from django.shortcuts import get_object_or_404

class CategoriaListaCrearVista(APIView):
    def get(self, request,empresa_id):
        """
        Listar todas las categorías (GET)
        """
        categorias = Categoria.objects.filter(empresa_id=empresa_id)
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request,empresa_id):
        """
        Crear nueva categoría (POST)
        """
        data = request.data.copy()
        data['empresa'] = empresa_id
        serializer = CategoriaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoriaDetalleVista(APIView):
    def get(self, request,empresa_id, pk):
        """
        Obtener una categoría específica (GET)
        """
        categoria = get_object_or_404(Categoria, pk=pk,empresa_id=empresa_id)
        serializer = CategoriaSerializer(categoria)
        return Response(serializer.data)

    def put(self, request,empresa_id, pk):
        """
        Actualizar una categoría existente (PUT)
        """
        categoria = get_object_or_404(Categoria, pk=pk, empresa_id=empresa_id)
        serializer = CategoriaSerializer(categoria, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, empresa_id, pk):
        """
        Eliminar una categoría (DELETE)
        """
        categoria = get_object_or_404(Categoria, pk=pk, empresa_id=empresa_id)
        categoria.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
