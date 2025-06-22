from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from decimal import Decimal

from Ventas.models import (
    Pedido, DetallePedido, Cliente, Caja, 
    MovimientoEfectivo, Transaccion, TipoPago
)
from Productos.models import Producto, Inventario
from accounts.models import Usuario

class BaseReporteView(APIView):
    """Base class for all report views with common utility methods"""
    
    def parse_date_params(self, request):
        """Parse and validate date range parameters"""
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        try:
            if fecha_inicio:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
            else:
                # Default to 30 days ago if not specified
                fecha_inicio = timezone.now() - timedelta(days=30)
                
            if fecha_fin:
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
                # Set time to end of day
                fecha_fin = datetime.combine(fecha_fin.date(), datetime.max.time())
            else:
                fecha_fin = timezone.now()
                
        except ValueError:
            return None, None, "Formato de fecha inválido. Use YYYY-MM-DD."
            
        return fecha_inicio, fecha_fin, None


class ReporteVentasView(BaseReporteView):
    """
    GET: Genera reportes de ventas para un usuario
    """
    def get(self, request, usuario_id):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            tipo_reporte = request.query_params.get('tipo', 'general')  # general, productos, clientes
            
            # Base query - get sales for the user within date range
            ventas = Pedido.objects.filter(usuario_id=usuario_id)
            
            if fecha_inicio:
                ventas = ventas.filter(fecha__gte=fecha_inicio)
            if fecha_fin:
                ventas = ventas.filter(fecha__lte=fecha_fin)
                
            if not ventas.exists():
                return Response({
                    "message": "No se encontraron ventas para el período especificado",
                    "data": []
                }, status=status.HTTP_200_OK)
            
            # Generate report based on type
            if tipo_reporte == 'general':
                # General sales report
                ventas_data = []
                total_ventas = 0
                total_items = 0
                
                for venta in ventas:
                    detalles = DetallePedido.objects.filter(pedido=venta)
                    cantidad_items = sum(detalle.cantidad for detalle in detalles)
                    total_items += cantidad_items
                    total_ventas += float(venta.total)
                    
                    # Obtener métodos de pago
                    metodos_pago = []
                    transacciones = Transaccion.objects.filter(pedido=venta)
                    for transaccion in transacciones:
                        metodos_pago.append({
                            'tipo': transaccion.tipo_pago.nombre if transaccion.tipo_pago else 'Efectivo',
                            'monto': float(transaccion.monto)
                        })
                    
                    # Obtener estado de la venta
                    estado_descripcion = 'Completado'
                    if hasattr(venta, 'estado') and venta.estado:
                        estado_descripcion = venta.estado.descripcion if hasattr(venta.estado, 'descripcion') else str(venta.estado)
                    
                    ventas_data.append({
                        'id': venta.id,
                        'fecha': venta.fecha.strftime('%Y-%m-%d %H:%M'),
                        'cliente': 'Cliente General',  # Ya no hay cliente directo
                        'estado': estado_descripcion,
                        'cantidad_items': cantidad_items,
                        'total': float(venta.total),
                        'metodos_pago': metodos_pago
                    })
                    
                # Get sales by payment method
                metodos_pago_totales = {}
                for venta in ventas:
                    transacciones = Transaccion.objects.filter(pedido=venta)
                    for transaccion in transacciones:
                        tipo_pago = transaccion.tipo_pago.nombre if transaccion.tipo_pago else 'Efectivo'
                        if tipo_pago not in metodos_pago_totales:
                            metodos_pago_totales[tipo_pago] = 0
                        metodos_pago_totales[tipo_pago] += float(transaccion.monto)
                
                return Response({
                    'tipo_reporte': 'ventas_general',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'resumen': {
                        'total_ventas_bs': float(total_ventas),
                        'cantidad_ventas': ventas.count(),
                        'promedio_venta': float(total_ventas / ventas.count()) if ventas.count() > 0 else 0,
                        'total_items_vendidos': total_items,
                        'ventas_por_metodo_pago': metodos_pago_totales
                    },
                    'ventas': ventas_data
                })
                
            elif tipo_reporte == 'productos':
                # Report of products sold
                productos_vendidos = {}
                
                for venta in ventas:
                    detalles = DetallePedido.objects.filter(pedido=venta)
                    
                    for detalle in detalles:
                        producto_id = detalle.producto.id
                        producto_nombre = detalle.producto.nombre
                        
                        if producto_id not in productos_vendidos:
                            productos_vendidos[producto_id] = {
                                'id': producto_id,
                                'nombre': producto_nombre,
                                'cantidad_vendida': 0,
                                'ventas_total': 0,
                                'precio_promedio': 0
                            }
                        
                        productos_vendidos[producto_id]['cantidad_vendida'] += detalle.cantidad
                        precio_unitario = float(detalle.producto.precio_venta)
                        productos_vendidos[producto_id]['ventas_total'] += precio_unitario * detalle.cantidad
                        productos_vendidos[producto_id]['precio_promedio'] = precio_unitario
                        
                # Sort products by total sales amount (descending)
                productos_ordenados = sorted(
                    list(productos_vendidos.values()), 
                    key=lambda x: x['ventas_total'], 
                    reverse=True
                )
                        
                return Response({
                    'tipo_reporte': 'ventas_productos',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'total_productos_vendidos': len(productos_vendidos),
                    'productos': productos_ordenados
                })
                
            elif tipo_reporte == 'clientes':
                # Report of sales by customer - pero como no hay cliente directo, 
                # agrupamos por usuario o mostramos mensaje informativo
                return Response({
                    'tipo_reporte': 'ventas_clientes',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'message': 'Los pedidos no tienen información de clientes específicos asociados',
                    'total_clientes': 0,
                    'clientes': []
                })
                
            else:
                return Response({
                    'error': 'Tipo de reporte no válido',
                    'tipos_disponibles': ['general', 'productos', 'clientes']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReporteCajaView(BaseReporteView):
    """
    GET: Genera reportes detallados de cajas para un usuario
    """
    def get(self, request, usuario_id):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            caja_id = request.query_params.get('caja_id')
            tipo_reporte = request.query_params.get('tipo', 'resumen')  # resumen, detallado
            
            # Base query - get cash registers for the user within date range
            cajas = Caja.objects.filter(usuario_id=usuario_id)
            
            if fecha_inicio:
                cajas = cajas.filter(fecha_apertura__gte=fecha_inicio)
            if fecha_fin:
                cajas = cajas.filter(fecha_apertura__lte=fecha_fin)
                
            if caja_id and caja_id.isdigit():
                cajas = cajas.filter(id=int(caja_id))
            
            if not cajas.exists():
                return Response({
                    "message": "No se encontraron cajas para el período especificado",
                    "data": []
                }, status=status.HTTP_200_OK)
            
            # Generate report
            data = []
            total_general = {
                'monto_inicial_total': 0,
                'monto_final_total': 0,
                'total_efectivo_total': 0,
                'total_qr_total': 0,
                'total_tarjeta_total': 0,
                'total_ventas': 0
            }
            
            for caja in cajas:
                # Get all sales for this cash register
                ventas = Pedido.objects.filter(caja_id=caja.id)
                
                # Calculate totals by payment method
                total_efectivo = 0
                total_qr = 0
                total_tarjeta = 0
                
                for venta in ventas:
                    transacciones = Transaccion.objects.filter(pedido=venta)
                    for transaccion in transacciones:
                        if transaccion.tipo_pago and 'efectivo' in transaccion.tipo_pago.nombre.lower():
                            total_efectivo += float(transaccion.monto)
                        elif transaccion.tipo_pago and 'qr' in transaccion.tipo_pago.nombre.lower():
                            total_qr += float(transaccion.monto)
                        elif transaccion.tipo_pago and 'tarjeta' in transaccion.tipo_pago.nombre.lower():
                            total_tarjeta += float(transaccion.monto)
                
                # Calculate final amount if not already calculated
                if caja.estado == 'abierta':
                    monto_final = float(caja.monto_inicial) + total_efectivo
                else:
                    monto_final = float(caja.monto_final) if caja.monto_final else 0
                
                # Update total general
                total_general['monto_inicial_total'] += float(caja.monto_inicial)
                total_general['monto_final_total'] += monto_final
                total_general['total_efectivo_total'] += total_efectivo
                total_general['total_qr_total'] += total_qr
                total_general['total_tarjeta_total'] += total_tarjeta
                total_general['total_ventas'] += ventas.count()
                
                # Add to data
                data.append({
                    'id': caja.id,
                    'fecha_apertura': caja.fecha_apertura.strftime('%Y-%m-%d %H:%M'),
                    'fecha_cierre': caja.fecha_cierre.strftime('%Y-%m-%d %H:%M') if caja.fecha_cierre else 'Abierta',
                    'estado': caja.estado,
                    'monto_inicial': float(caja.monto_inicial),
                    'monto_final': float(monto_final),
                    'total_efectivo': float(total_efectivo),
                    'total_qr': float(total_qr),
                    'total_tarjeta': float(total_tarjeta),
                    'total_ventas': ventas.count(),
                    'empleado': usuario.nombre if usuario else 'N/A'
                })
            
            return Response({
                'tipo_reporte': 'resumen_caja',
                'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                'total_cajas': cajas.count(),
                'total_general': total_general,
                'cajas': data
            })
                
        except Exception as e:
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReporteClientesView(BaseReporteView):
    """
    GET: Genera reportes de clientes para un usuario
    """
    def get(self, request, usuario_id):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
            
            tipo_reporte = request.query_params.get('tipo', 'general')  # general, frecuencia
            search_term = request.query_params.get('search', '')
            
            # Base query - get all customers for the user
            clientes = Cliente.objects.filter(usuario_id=usuario_id)
            
            # Aplicar filtro de búsqueda si existe
            if search_term:
                clientes = clientes.filter(
                    Q(nombre__icontains=search_term) |
                    Q(cedula_identidad__icontains=search_term) |
                    Q(telefono__icontains=search_term) |
                    Q(email__icontains=search_term)
                )
            
            if not clientes.exists():
                return Response({
                    "message": "No se encontraron clientes registrados",
                    "data": []
                }, status=status.HTTP_200_OK)
            
            # Generate basic report - solo información básica de clientes
            clientes_data = []
            
            for cliente in clientes:
                clientes_data.append({
                    'id': cliente.id,
                    'nombre': cliente.nombre,
                    'cedula_identidad': getattr(cliente, 'cedula_identidad', None),
                    'telefono': getattr(cliente, 'telefono', None),
                    'email': getattr(cliente, 'email', None),
                    'direccion': getattr(cliente, 'direccion', None)
                })
            
            # Ordenar clientes por nombre
            clientes_data_ordenados = sorted(
                clientes_data, 
                key=lambda x: x['nombre']
            )
            
            return Response({
                'tipo_reporte': 'clientes_general',
                'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                'resumen': {
                    'total_clientes': clientes.count(),
                },
                'clientes': clientes_data_ordenados
            })
            
        except Exception as e:
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReporteMovimientosView(BaseReporteView):
    """
    GET: Genera reportes de movimientos de caja para un usuario
    """
    def get(self, request, usuario_id):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            caja_id = request.query_params.get('caja_id')
            
            # Base query - get all cash movements within date range
            movimientos = MovimientoEfectivo.objects.filter(caja__usuario_id=usuario_id)
            
            if fecha_inicio:
                movimientos = movimientos.filter(fecha__gte=fecha_inicio)
            if fecha_fin:
                movimientos = movimientos.filter(fecha__lte=fecha_fin)
                
            if caja_id and caja_id.isdigit():
                movimientos = movimientos.filter(caja_id=int(caja_id))
                
            if not movimientos.exists():
                return Response({
                    "message": "No se encontraron movimientos para el período especificado",
                    "data": []
                }, status=status.HTTP_200_OK)
                
            # Group movements by cash register
            movimientos_por_caja = {}
            total_ingresos = 0
            total_retiros = 0
            
            for movimiento in movimientos:
                caja_id = movimiento.caja.id
                
                if caja_id not in movimientos_por_caja:
                    movimientos_por_caja[caja_id] = {
                        'caja_id': caja_id,
                        'fecha_apertura': movimiento.caja.fecha_apertura.strftime('%Y-%m-%d %H:%M'),
                        'estado_caja': movimiento.caja.estado,
                        'total_ingresos': 0,
                        'total_retiros': 0,
                        'movimientos': []
                    }
                    
                # Add movement to its cash register
                movimientos_por_caja[caja_id]['movimientos'].append({
                    'id': movimiento.id,
                    'tipo': movimiento.tipo,
                    'monto': float(movimiento.monto),
                    'fecha': movimiento.fecha.strftime('%Y-%m-%d %H:%M'),
                    'descripcion': movimiento.descripcion
                })
                
                # Update totals
                if movimiento.tipo == 'ingreso':
                    movimientos_por_caja[caja_id]['total_ingresos'] += float(movimiento.monto)
                    total_ingresos += float(movimiento.monto)
                else:
                    movimientos_por_caja[caja_id]['total_retiros'] += float(movimiento.monto)
                    total_retiros += float(movimiento.monto)
            
            # Calculate net movement for each cash register
            for caja_id in movimientos_por_caja:
                movimientos_por_caja[caja_id]['balance_neto'] = (
                    movimientos_por_caja[caja_id]['total_ingresos'] - movimientos_por_caja[caja_id]['total_retiros']
                )
                    
            return Response({
                'tipo_reporte': 'movimientos_caja',
                'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                'resumen': {
                    'total_movimientos': movimientos.count(),
                    'total_ingresos': total_ingresos,
                    'total_retiros': total_retiros,
                    'balance_neto': total_ingresos - total_retiros
                },
                'cajas': list(movimientos_por_caja.values())
            })
            
        except Exception as e:
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)