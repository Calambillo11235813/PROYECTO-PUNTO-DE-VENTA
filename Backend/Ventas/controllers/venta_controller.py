from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Venta, Pedido, DetallePedido
from Ventas.serializers import VentaSerializer
from Productos.models import Inventario, Producto
from django.db import transaction

class VentaListCreateAPIView(APIView):
    def get(self, request, empresa_id):
        ventas = Venta.objects.filter(empresa_id=empresa_id)
        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, empresa_id):
        data = request.data.copy()
        data['empresa'] = empresa_id  # Forzar empresa correcta en el body

        serializer = VentaSerializer(data=data)
        if serializer.is_valid():
            venta = serializer.save()

            pedido = venta.pedido  # Venta tiene OneToOne con Pedido

            # Validar inventario de todos los productook s del pedido
            for detalle in pedido.detallepedido_set.all():
                try:
                    inventario = Inventario.objects.get(producto=detalle.producto, empresa_id=empresa_id)
                except Inventario.DoesNotExist:
                    venta.delete()
                    return Response(
                        {"error": f"No hay inventario para el producto {detalle.producto.nombre}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if inventario.stock < detalle.cantidad:
                    venta.delete()
                    return Response(
                        {"error": f"Stock insuficiente para el producto {detalle.producto.nombre}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Restar stock
            for detalle in pedido.detallepedido_set.all():
                inventario = Inventario.objects.get(producto=detalle.producto, empresa_id=empresa_id)
                inventario.stock -= detalle.cantidad
                inventario.save()

            return Response(VentaSerializer(venta).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VentaRetrieveUpdateDestroyAPIView(APIView):
    def get_object(self, pk, empresa_id):
        try:
            return Venta.objects.get(pk=pk, empresa_id=empresa_id)
        except Venta.DoesNotExist:
            return None

    def get(self, request, empresa_id, pk):
        venta = self.get_object(pk, empresa_id)
        if not venta:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VentaSerializer(venta)
        return Response(serializer.data)

    def put(self, request, empresa_id, pk):
        venta = self.get_object(pk, empresa_id)
        if not venta:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['empresa'] = empresa_id  # asegurar que empresa sea correcta

        serializer = VentaSerializer(venta, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, empresa_id, pk):
        venta = self.get_object(pk, empresa_id)
        if not venta:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        venta.delete()
        return Response({'mensaje': 'Venta eliminada correctamente'}, status=status.HTTP_204_NO_CONTENT)
