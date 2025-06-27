from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import PedidoProveedor
from Productos.serializers import PedidoProveedorSerializer
from django.shortcuts import get_object_or_404
from accounts.models import Usuario  # Agrega este import al inicio del archivo
from rest_framework import permissions

class PedidoProveedorCreateView(APIView):
  
    def post(self, request, usuario_id):
        data = request.data.copy()
        usuario = get_object_or_404(Usuario, pk=usuario_id)
        serializer = PedidoProveedorSerializer(data=data)
        if serializer.is_valid():
            try:
                pedido = serializer.save(usuario=usuario)  # Pasa la instancia, no el id
                return Response(PedidoProveedorSerializer(pedido).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PedidoProveedorDeleteView(APIView):
    def delete(self, request, pk):
        pedido = get_object_or_404(PedidoProveedor, pk=pk)
        pedido.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PedidoProveedorPorSucursalView(APIView):
    def get(self, request, sucursal_id):
        pedidos = PedidoProveedor.objects.filter(sucursal_id=sucursal_id)
        serializer = PedidoProveedorSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PedidoProveedorPorSucursalYUsuarioView(APIView):
    def get(self, request, usuario_id, sucursal_id):
        pedidos = PedidoProveedor.objects.filter(usuario_id=usuario_id, sucursal_id=sucursal_id)
        serializer = PedidoProveedorSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PedidoProveedorUpdateView(APIView):


    def patch(self, request, pk):
        pedido = get_object_or_404(PedidoProveedor, pk=pk)
        serializer = PedidoProveedorSerializer(pedido, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)