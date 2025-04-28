from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Producto, Categoria
from Productos.serializers import ProductoSerializer
from django.shortcuts import get_object_or_404

class ProductoListaCrearVista(APIView):
    """
    Vista para listar todos los productos de una empresa o crear uno nuevo.
    """

    def get(self, request, empresa_id):
        """
        Obtener la lista de productos de una empresa específica (GET)
        """
        productos = Producto.objects.filter(empresa_id=empresa_id)
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data)

    def post(self, request, empresa_id):
        """
        Crear un nuevo producto asociado a una empresa específica (POST)
        """
        data = request.data.copy()
        data['empresa_id'] = empresa_id  # Asignamos la empresa al producto

        serializer = ProductoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductoDetalleVista(APIView):
    """
    Vista para obtener, actualizar o eliminar un producto específico por ID, restringido a empresa.
    """

    def get(self, request, empresa_id, pk):
        """
        Obtener los datos de un producto por su ID y empresa (GET)
        """
        producto = get_object_or_404(Producto, pk=pk, empresa_id=empresa_id)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data)

    def put(self, request, empresa_id, pk):
        """
        Actualizar todos los datos de un producto por ID y empresa (PUT)
        """
        producto = get_object_or_404(Producto, pk=pk, empresa_id=empresa_id)
        data = request.data.copy()
        data['empresa'] = empresa_id  # aseguramos empresa correcta
        serializer = ProductoSerializer(producto, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, empresa_id, pk):
        """
        Eliminar un producto por su ID y empresa (DELETE)
        """
        producto = get_object_or_404(Producto, pk=pk, empresa_id=empresa_id)
        producto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductosPorCategoriaView(APIView):
    """
    Vista para listar productos de una empresa por categoría.
    """

    def get(self, request, empresa_id, valor):
        """
        Obtener productos de una categoría específica (ID o nombre) para una empresa (GET)
        """
        try:
            # Buscar la categoría dentro de la empresa
            try:
                categoria = Categoria.objects.get(id=valor, empresa_id=empresa_id)
            except Categoria.DoesNotExist:
                categoria = Categoria.objects.get(nombre__iexact=valor, empresa_id=empresa_id)

            productos = Producto.objects.filter(categoria=categoria, empresa_id=empresa_id)
            serializer = ProductoSerializer(productos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Categoria.DoesNotExist:
            return Response({'error': 'Categoría no encontrada'}, status=status.HTTP_404_NOT_FOUND)