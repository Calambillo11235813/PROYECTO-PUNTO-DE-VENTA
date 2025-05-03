from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Inventario, Producto
from Ventas.models import Pedido, DetallePedido
from Ventas.serializers import PedidoSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

class PedidoListCreateAPIView(APIView):
    def get(self, request, usuario_id):
        pedidos = Pedido.objects.filter(usuario_id=usuario_id)
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, usuario_id):
        data = request.data.copy()
        data['usuario'] = usuario_id

        detalles_data = data.get('detalles_input', [])
        if not detalles_data:
            return Response(
                {"error": "Debes enviar al menos un detalle de pedido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock de todos los productos primero
        for detalle in detalles_data:
            producto = get_object_or_404(Producto, pk=detalle['producto_id'])
            try:
                inventario = Inventario.objects.get(producto=producto, producto__usuario_id=usuario_id)
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
            pedido = pedido_serializer.save()

            # Descontar stock ahora sí
            for detalle in detalles_data:
                producto = get_object_or_404(Producto, pk=detalle['producto_id'])
                inventario = Inventario.objects.get(producto=producto, producto__usuario_id=usuario_id)

                inventario.stock -= detalle['cantidad']
                inventario.save()

            return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)

        return Response(pedido_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PedidoDetailAPIView(APIView):
    def get(self, request, usuario_id, pedido_id):
        # Obtener un pedido específico
        pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
        serializer = PedidoSerializer(pedido)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def delete(self, request, usuario_id, pedido_id):
        try:
            # Verificar que el pedido exista y pertenezca al usuario
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            
            # Recuperar el inventario descontado al crear el pedido
            detalles = DetallePedido.objects.filter(pedido=pedido)
            
            # Devolver stock al inventario
            for detalle in detalles:
                try:
                    inventario = Inventario.objects.get(
                        producto=detalle.producto, 
                        producto__usuario_id=usuario_id
                    )
                    # Incrementar stock
                    inventario.stock += detalle.cantidad
                    inventario.save()
                except Inventario.DoesNotExist:
                    # Si no existe inventario, crear uno nuevo
                    Inventario.objects.create(
                        producto=detalle.producto,
                        stock=detalle.cantidad
                    )
            
            # Eliminar el pedido (esto elimina automáticamente los detalles por CASCADE)
            pedido.delete()
            
            return Response(
                {"message": f"Pedido #{pedido_id} eliminado correctamente y stock reestablecido."},
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar pedido: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, usuario_id, pedido_id):
        try:
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            serializer = PedidoSerializer(pedido, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar pedido: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
