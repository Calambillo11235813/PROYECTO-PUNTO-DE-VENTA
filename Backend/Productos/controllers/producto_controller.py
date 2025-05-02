from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Producto, Categoria
from Productos.serializers import ProductoSerializer
from accounts.models import Usuario
from accounts.serializers import UsuarioSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
class ProductoListaCrearVista(APIView):
    """
    Vista para listar todos los productos de una empresa o crear uno nuevo.
    """

    def get(self, request, usuario_id):
        """
        Obtener la lista de productos de una empresa específica (GET)
        """
        productos = Producto.objects.filter(usuario_id=usuario_id)
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data)

    def post(self, request, usuario_id):
        data = request.data.copy()
        nombre_producto = data.get('nombre')

        # Verificar si el producto ya existe para ese usuario
        producto_existente = Producto.objects.filter(nombre__iexact=nombre_producto, usuario_id=usuario_id).first()

        if producto_existente:
            # Si existe, sumamos el stock
            inventario = producto_existente.inventario
            stock_adicional = int(data.get('stock_inicial', 0))  # Si no viene, usa 0

            inventario.stock += stock_adicional
            inventario.save()

            serializer = ProductoSerializer(producto_existente)
            return Response({
                "mensaje": "Producto ya existía. Stock actualizado.",
                "producto": serializer.data
            }, status=status.HTTP_200_OK)

        # Si no existe, se crea normalmente
        data['usuario_id'] = usuario_id
        serializer = ProductoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
       
    


class ProductoDetalleVista(APIView):
    """
    Vista para obtener, actualizar o eliminar un producto específico por ID, restringido a empresa.
    """

    def get(self, request, usuario_id, pk):
        """
        Obtener los datos de un producto por su ID y empresa (GET)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data)

    def put(self, request, usuario_id, pk):
        """
        Actualizar todos los datos de un producto por ID y empresa (PUT)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        data = request.data.copy()
        data['usuario_id'] = usuario_id  
        serializer = ProductoSerializer(producto, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, usuario_id, pk):
        """
        Eliminar un producto por su ID y empresa (DELETE)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        producto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductosPorCategoriaView(APIView):
    """
    Vista para listar productos de una empresa por categoría.
    """

    def get(self, request, usuario_id, valor):
        """
        Obtener productos de una categoría específica (ID o nombre) para una empresa (GET)
        """
        try:
            # Buscar la categoría dentro de la empresa
            try:
                categoria = Categoria.objects.get(id=valor, usuario_id=usuario_id)
            except Categoria.DoesNotExist:
                categoria = Categoria.objects.get(nombre__iexact=valor, usuario_id=usuario_id)

            productos = Producto.objects.filter(categoria=categoria, usuario_id=usuario_id)
            serializer = ProductoSerializer(productos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Categoria.DoesNotExist:
            return Response({'error': 'Categoría no encontrada'}, status=status.HTTP_404_NOT_FOUND)