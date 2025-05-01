from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import  Inventario, Producto
from Ventas.models import Pedido, DetallePedido
from Ventas.serializers import PedidoSerializer
from accounts.models import Empresa
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Inventario, Producto
from Ventas.models import Pedido
from Ventas.serializers import PedidoSerializer
from accounts.models import Empresa
from django.db import transaction
from django.shortcuts import get_object_or_404

class PedidoListCreateAPIView(APIView):
    def get(self, request, empresa_id):
        pedidos = Pedido.objects.filter(usuario__empresa_id=empresa_id)
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, empresa_id):
        data = request.data.copy()
        empresa = get_object_or_404(Empresa, pk=empresa_id)
        data['empresa'] = empresa.id

        detalles_data = data.get('detalles', [])
        if not detalles_data:
            return Response(
                {"error": "Debes enviar al menos un detalle de pedido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock de todos los productos primero
        for detalle in detalles_data:
            producto = get_object_or_404(Producto, pk=detalle['producto_id'])
            try:
                inventario = Inventario.objects.get(producto=producto, producto__empresa_id=empresa_id)
            except Inventario.DoesNotExist:
                return Response(
                    {"error": f"No hay inventario registrado para el producto {producto.nombre}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if inventario.stock < detalle['cantidad']:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Ahora que el stock está validado, crear pedido y detalles
        pedido_serializer = PedidoSerializer(data=data)
        if pedido_serializer.is_valid():
            pedido = pedido_serializer.save(empresa=empresa)

            # Descontar stock ahora sí
            for detalle in detalles_data:
                producto = get_object_or_404(Producto, pk=detalle['producto_id'])
                inventario = Inventario.objects.get(producto=producto, producto__empresa_id=empresa_id)

                inventario.stock -= detalle['cantidad']
                inventario.save()

            return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)

        return Response(pedido_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
