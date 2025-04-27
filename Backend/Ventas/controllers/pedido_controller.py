from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Pedido, DetallePedido
from Ventas.serializers import PedidoSerializer
from django.db import transaction

class PedidoListCreateAPIView(APIView):
    def get(self, request, empresa_id):
        pedidos = Pedido.objects.filter(empresa_id=empresa_id)
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, empresa_id):
        data = request.data.copy()
        data['empresa'] = empresa_id  # Forzamos que siempre se guarde en la empresa correcta
        serializer = PedidoSerializer(data=data)
        if serializer.is_valid():
            pedido = serializer.save()
            return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PedidoRetrieveUpdateDestroyAPIView(APIView):
    def get_object(self, empresa_id, pk):
        try:
            return Pedido.objects.get(pk=pk, empresa_id=empresa_id)
        except Pedido.DoesNotExist:
            return None

    def get(self, request, empresa_id, pk):
        pedido = self.get_object(empresa_id, pk)
        if not pedido:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PedidoSerializer(pedido)
        return Response(serializer.data)

    def put(self, request, empresa_id, pk):
        pedido = self.get_object(empresa_id, pk)
        if not pedido:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data.copy()
        data['empresa'] = empresa_id  # Por si acaso
        serializer = PedidoSerializer(pedido, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, empresa_id, pk):
        pedido = self.get_object(empresa_id, pk)
        if not pedido:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        pedido.delete()
        return Response({'mensaje': 'Pedido eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
