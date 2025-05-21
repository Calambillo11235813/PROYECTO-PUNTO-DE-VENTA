from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Inventario, Producto
from Ventas.models import Pedido, DetallePedido, Estado, TipoVenta
from Ventas.models import Pedido, DetallePedido, Estado, TipoVenta, Caja
from Ventas.serializers import PedidoSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from decimal import Decimal

class PedidoListCreateAPIView(APIView):
    def get(self, request, usuario_id):
        pedidos = Pedido.objects.filter(usuario_id=usuario_id)
        serializer = PedidoSerializer(pedidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, usuario_id):
        data = request.data.copy()
        data['usuario'] = usuario_id

        # Validar que exista caja abierta para este usuario
        caja_abierta = Caja.objects.filter(usuario_id=usuario_id, estado='abierta').first()
        if not caja_abierta:
            return Response(
                {"error": "No hay caja abierta para este usuario. No se puede registrar la venta."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Asociar la venta a la caja abierta
        data['caja'] = caja_abierta.id

        detalles_data = data.get('detalles_input', [])
        if not detalles_data:
            return Response(
                {"error": "Debes enviar al menos un detalle de pedido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar stock para todos los productos
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

        # Crear pedido con serializer
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
        """
        Obtiene los detalles completos de un pedido específico
        """
        try:
            # Obtener el pedido
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            
            # Obtener los detalles asociados al pedido
            detalles_pedido = DetallePedido.objects.filter(pedido=pedido)
            
            # Obtener las transacciones asociadas al pedido
            from Ventas.models import Transaccion
            transacciones = Transaccion.objects.filter(pedido=pedido)
            
            # Obtener la información básica del pedido
            pedido_data = {
                'id': pedido.id,
                'fecha': pedido.fecha,
                'fecha_creacion': pedido.fecha.strftime('%Y-%m-%d'),
                'estado': pedido.estado.id if pedido.estado else None,
                'estado_nombre': pedido.estado.descripcion if pedido.estado else "No definido",
                'total': float(pedido.total),
                'tipo_venta': pedido.tipo_venta.id if hasattr(pedido, 'tipo_venta') and pedido.tipo_venta else None,
                'tipo_venta_nombre': pedido.tipo_venta.descripcion if hasattr(pedido, 'tipo_venta') and pedido.tipo_venta else "Venta directa",
                'cliente': "Cliente general",  # Puedes personalizar esto si tienes clientes asociados
                'detalles': []
                'cliente': "Cliente general",
                'detalles': [],
                'transacciones': []
            }
            
            # Agregar los detalles de productos
            for detalle in detalles_pedido:
                producto = detalle.producto
                precio = float(producto.precio_venta) if producto else 0
                subtotal = precio * detalle.cantidad
                
                detalle_data = {
                    'id': detalle.id,
                    'producto': producto.id if producto else None,
                    'producto_nombre': producto.nombre if producto else "Producto no disponible",
                    'cantidad': detalle.cantidad,
                    'precio_unitario': precio,
                    'subtotal': subtotal
                }
                pedido_data['detalles'].append(detalle_data)
            
            # Calcular subtotal e impuestos
            subtotal = sum(detalle['subtotal'] for detalle in pedido_data['detalles'])
            impuestos = subtotal * 0.16  # Asumiendo IVA del 16%
            
            # Agregar información adicional
            pedido_data['subtotal'] = subtotal
            pedido_data['impuestos'] = impuestos
            pedido_data['total_con_impuestos'] = subtotal + impuestos
                pedido_data['detalles'].append({
                    'id': detalle.id,
                    'producto': detalle.producto.nombre,
                    'cantidad': detalle.cantidad,
                    'precio_unitario': float(detalle.producto.precio_venta),
                    'subtotal': float(detalle.producto.precio_venta * detalle.cantidad)
                })
            
            # Agregar las transacciones
            for transaccion in transacciones:
                pedido_data['transacciones'].append({
                    'id': transaccion.id,
                    'tipo_pago': transaccion.tipo_pago.nombre,
                    'tipo_pago_id': transaccion.tipo_pago.id,
                    'monto': float(transaccion.monto)
                })
            
            # Calcular subtotal (sin impuestos)
            subtotal = sum(item['subtotal'] for item in pedido_data['detalles'])
            pedido_data['subtotal'] = subtotal
            
            return Response(pedido_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error al obtener detalles del pedido: {str(e)}"},
                {'error': f'Error al obtener detalles del pedido: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
