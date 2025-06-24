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
    GET: Genera reportes de ventas para un usuario, filtrado por sucursal
    """
    def get(self, request, usuario_id, sucursal_id=None):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            tipo_reporte = request.query_params.get('tipo', 'general')
            
            # Base query - get sales for the user
            ventas = Pedido.objects.filter(usuario_id=usuario_id)
            
            # Filtrar por sucursal si se proporciona
            if sucursal_id:
                ventas = ventas.filter(sucursal_id=sucursal_id)
            
            # Filtrar por fechas
            if fecha_inicio:
                ventas = ventas.filter(fecha__gte=fecha_inicio)
            if fecha_fin:
                ventas = ventas.filter(fecha__lte=fecha_fin)
                
            if not ventas.exists():
                return Response({
                    "message": f"No se encontraron ventas para el período especificado{' en la sucursal seleccionada' if sucursal_id else ''}",
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
                
                # Añadir información de sucursal al resultado
                sucursal_info = None
                if sucursal_id:
                    from Sucursales.models import Sucursal
                    sucursal = Sucursal.objects.filter(id=sucursal_id).first()
                    if sucursal:
                        sucursal_info = {
                            'id': sucursal.id,
                            'nombre': sucursal.nombre
                        }
                
                # Modificar la respuesta para incluir datos de sucursal
                response_data = {
                    'tipo_reporte': 'ventas_general',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'sucursal': sucursal_info,
                    'resumen': {
                        'total_ventas_bs': float(total_ventas),
                        'cantidad_ventas': ventas.count(),
                        'promedio_venta': float(total_ventas / ventas.count()) if ventas.count() > 0 else 0,
                        'total_items_vendidos': total_items,
                        'ventas_por_metodo_pago': metodos_pago_totales
                    },
                    'ventas': ventas_data
                }
                
                return Response(response_data)
                
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
    def get(self, request, usuario_id, sucursal_id=None):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            caja_id = request.query_params.get('caja_id')
            tipo_reporte = request.query_params.get('tipo', 'resumen')  # resumen, detallado
            
            # Base query - get cash registers for the user
            cajas = Caja.objects.filter(usuario_id=usuario_id)
            
            # Filtrar por sucursal si se proporciona
            if sucursal_id:
                cajas = cajas.filter(sucursal_id=sucursal_id)
                
            # Filtrar por fechas
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
    def get(self, request, usuario_id, sucursal_id=None):
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
            
            # Filtrar por sucursal si se proporciona
            if sucursal_id:
                print(f"Filtrando clientes por sucursal: {sucursal_id}")
                clientes = clientes.filter(sucursal_id=sucursal_id)
                print(f"Clientes encontrados: {clientes.count()}")
            
            # Resto del método igual que antes...
            if tipo_reporte == 'general':
                # Reporte general de clientes
                clientes_data = []
                
                # Imprimir campos disponibles en Pedido para debug
                from django.db import models
                print("Campos de Pedido:", [f.name for f in Pedido._meta.get_fields()])
                
                for cliente in clientes:
                    # CORRECCIÓN: Obtener ventas del cliente usando el ID del cliente
                    # Asumiendo que el campo en Pedido puede ser 'cliente_id' en lugar de 'cliente'
                    try:
                        # Intentar encontrar la relación correcta
                        # Primero verificamos si hay un campo específico para cliente
                        if hasattr(Pedido, 'cliente'):
                            ventas = Pedido.objects.filter(cliente=cliente)
                        elif hasattr(Pedido, 'cliente_id'):
                            ventas = Pedido.objects.filter(cliente_id=cliente.id)
                        # O puede que la relación esté definida en un campo diferente o a través de otra tabla
                        else:
                            # Si no podemos encontrar una relación directa, intenta buscar en detalles
                            # Esto depende de tu estructura exacta de modelos
                            from django.db.models import Q
                            # Busca referencias al cliente en detalles o en otros campos
                            ventas = Pedido.objects.filter(
                                Q(detalles__cliente_id=cliente.id) |
                                Q(usuario_id=usuario_id)  # Filtro fallback
                            ).distinct()
                            
                        total_ventas_cliente = sum(float(venta.total) for venta in ventas)
                        cantidad_pedidos = ventas.count()
                    except Exception as e:
                        print(f"Error al obtener ventas del cliente {cliente.id}: {e}")
                        # En caso de error, usamos valores predeterminados
                        total_ventas_cliente = 0
                        cantidad_pedidos = 0
                    
                    clientes_data.append({
                        'id': cliente.id,
                        'nombre': cliente.nombre,
                        'telefono': cliente.telefono,
                        'email': cliente.email,
                        'direccion': cliente.direccion,
                        'total_ventas': total_ventas_cliente,
                        'cantidad_pedidos': cantidad_pedidos,
                        'sucursal_id': cliente.sucursal_id if hasattr(cliente, 'sucursal_id') else None
                    })
                
                # Incluir información de sucursal en la respuesta
                sucursal_info = None
                if sucursal_id:
                    from Sucursales.models import Sucursal
                    sucursal = Sucursal.objects.filter(id=sucursal_id).first()
                    if sucursal:
                        sucursal_info = {
                            'id': sucursal.id,
                            'nombre': sucursal.nombre
                        }
                
                return Response({
                    'tipo_reporte': 'clientes_general',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'total_clientes': clientes.count(),
                    'clientes': clientes_data,
                    'sucursal': sucursal_info
                })
                
            elif tipo_reporte == 'frecuencia':
                # Reporte de frecuencia de compra
                query = Pedido.objects.filter(usuario_id=usuario_id)
                
                # Filtrar por sucursal si corresponde
                if sucursal_id:
                    query = query.filter(sucursal_id=sucursal_id)
                
                # Filtrar por fechas si se especifican
                if fecha_inicio:
                    query = query.filter(fecha__gte=fecha_inicio)
                if fecha_fin:
                    query = query.filter(fecha__lte=fecha_fin)
                
                frecuencia_compra = (
                    query
                    .annotate(dia=F('fecha__date'))
                    .values('dia')
                    .annotate(total_ventas=Sum('total'), cantidad_pedidos=Count('id'))
                    .order_by('dia')
                )
                
                frecuencia_data = []
                for dia_data in frecuencia_compra:
                    frecuencia_data.append({
                        'fecha': dia_data['dia'].strftime('%Y-%m-%d'),
                        'total_ventas': float(dia_data['total_ventas']),
                        'cantidad_pedidos': dia_data['cantidad_pedidos']
                    })
                
                # Incluir información de sucursal en la respuesta
                sucursal_info = None
                if sucursal_id:
                    from Sucursales.models import Sucursal
                    sucursal = Sucursal.objects.filter(id=sucursal_id).first()
                    if sucursal:
                        sucursal_info = {
                            'id': sucursal.id,
                            'nombre': sucursal.nombre
                        }
                
                return Response({
                    'tipo_reporte': 'clientes_frecuencia',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                    'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                    'total_dias_reportados': len(frecuencia_data),
                    'frecuencia_compra': frecuencia_data,
                    'sucursal': sucursal_info
                })
            
            else:
                return Response({
                    'error': 'Tipo de reporte no válido',
                    'tipos_disponibles': ['general', 'frecuencia']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Error en ReporteClientesView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReporteMovimientosView(BaseReporteView):
    """
    GET: Genera reportes de movimientos de caja para un usuario
    """
    def get(self, request, usuario_id, sucursal_id=None):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            caja_id = request.query_params.get('caja_id')
            
            # Base query - get all cash movements
            movimientos = MovimientoEfectivo.objects.filter(caja__usuario_id=usuario_id)
            
            # Filtrar por sucursal si se proporciona
            if sucursal_id:
                movimientos = movimientos.filter(caja__sucursal_id=sucursal_id)
            
            # Filtrar por fechas
            if fecha_inicio:
                movimientos = movimientos.filter(fecha__gte=fecha_inicio)
            if fecha_fin:
                movimientos = movimientos.filter(fecha__lte=fecha_fin)
                
            if not movimientos.exists():
                return Response({
                    "message": "No se encontraron movimientos para el período especificado",
                    "data": []
                }, status=status.HTTP_200_OK)
            
            # Obtener detalles de los movimientos
            movimientos_data = []
            for movimiento in movimientos:
                detalles = {
                    'id': movimiento.id,
                    'fecha': movimiento.fecha.strftime('%Y-%m-%d %H:%M'),
                    'tipo': 'Apertura' if movimiento.tipo == 'apertura' else 'Cierre' if movimiento.tipo == 'cierre' else 'Transacción',
                    'monto': float(movimiento.monto),
                    'descripcion': movimiento.descripcion if movimiento.descripcion else '',
                    'usuario': usuario.nombre if usuario else 'N/A',
                    'sucursal': movimiento.caja.sucursal.nombre if movimiento.caja and movimiento.caja.sucursal else 'N/A',
                    'caja_id': movimiento.caja.id if movimiento.caja else None
                }
                
                movimientos_data.append(detalles)
            
            return Response({
                'tipo_reporte': 'movimientos_caja',
                'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else 'No especificada',
                'fecha_fin': fecha_fin.strftime('%Y-%m-%d') if fecha_fin else 'No especificada',
                'total_movimientos': movimientos.count(),
                'movimientos': movimientos_data
            })
                
        except Exception as e:
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReporteProductosView(BaseReporteView):
    """
    GET: Genera reportes de productos para un usuario, filtrados por sucursal
    """
    def get(self, request, usuario_id, sucursal_id=None):
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Parse parameters
            fecha_inicio, fecha_fin, error = self.parse_date_params(request)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
                
            tipo_reporte = request.query_params.get('tipo', 'inventario')  # inventario, agotados, etc.
            categoria_id = request.query_params.get('categoria_id')
            
            print(f"Generando reporte de productos tipo '{tipo_reporte}' para usuario {usuario_id}")
            if sucursal_id:
                print(f"Filtrando por sucursal: {sucursal_id}")
            
            # Obtener productos base - USANDO EL FILTRO DIRECTO por sucursal_id si está disponible
            if sucursal_id is not None:
                productos_query = Producto.objects.filter(usuario_id=usuario_id, sucursal_id=sucursal_id)
                print(f"Productos encontrados por filtro directo: {productos_query.count()}")
            else:
                productos_query = Producto.objects.filter(usuario_id=usuario_id)
                print(f"Productos encontrados (sin filtro sucursal): {productos_query.count()}")
            
            # Filtrar por categoría si se especifica
            if categoria_id and categoria_id.isdigit():
                productos_query = productos_query.filter(categoria_id=int(categoria_id))
                print(f"Productos filtrados por categoría {categoria_id}: {productos_query.count()}")
            
            # Si no hay productos, devolver respuesta vacía
            if not productos_query.exists():
                return Response({
                    'tipo_reporte': tipo_reporte,
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'total_productos': 0,
                    'categoria_filtro': None,
                    'categoria_info': None,
                    'productos': [],
                    'sucursal': None
                }, status=status.HTTP_200_OK)
            
            # Procesar según el tipo de reporte
            if tipo_reporte == 'inventario':
                productos_data = []
                
                for producto in productos_query:
                    # Obtener información de inventario
                    try:
                        # Si existe relación con inventario
                        if hasattr(producto, 'inventario'):
                            stock_actual = producto.inventario.stock if producto.inventario else 0
                        else:
                            # Intenta buscar el inventario manualmente
                            try:
                                inventario = Inventario.objects.get(producto=producto)
                                stock_actual = inventario.stock
                            except Inventario.DoesNotExist:
                                stock_actual = 0
                    except Exception as e:
                        print(f"Error al obtener stock del producto {producto.id}: {e}")
                        stock_actual = 0
                    
                    # Añadir información del producto
                    productos_data.append({
                        'id': producto.id,
                        'nombre': producto.nombre,
                        'codigo': producto.codigo if hasattr(producto, 'codigo') else None,
                        'descripcion': producto.descripcion,
                        'precio_compra': str(producto.precio_compra),
                        'precio_venta': str(producto.precio_venta),
                        'stock_actual': stock_actual,
                        'categoria': producto.categoria.nombre if producto.categoria else 'Sin categoría',
                        'categoria_id': producto.categoria.id if producto.categoria else None,
                        'sucursal_id': producto.sucursal_id,  # Incluir ID de sucursal para filtrado en frontend
                    })
                
                # Incluir información de sucursal en la respuesta
                sucursal_info = None
                if sucursal_id:
                    from Sucursales.models import Sucursal
                    sucursal = Sucursal.objects.filter(id=sucursal_id).first()
                    if sucursal:
                        sucursal_info = {
                            'id': sucursal.id,
                            'nombre': sucursal.nombre
                        }
                
                # Generar respuesta
                response_data = {
                    'tipo_reporte': 'inventario',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'total_productos': len(productos_data),
                    'categoria_filtro': None,
                    'categoria_info': None,
                    'productos': productos_data,
                    'sucursal': sucursal_info
                }
                
                # Añadir información de categoría si se filtró
                if categoria_id and categoria_id.isdigit():
                    from Productos.models import Categoria
                    try:
                        categoria = Categoria.objects.get(id=int(categoria_id))
                        response_data['categoria_filtro'] = categoria.nombre
                        response_data['categoria_info'] = {
                            'id': categoria.id,
                            'nombre': categoria.nombre
                        }
                    except Categoria.DoesNotExist:
                        pass
                        
                return Response(response_data)
                
            elif tipo_reporte == 'agotados':
                # Reporte de productos agotados o con poco stock
                threshold = int(request.query_params.get('threshold', 5))  # Umbral para productos con poco stock
                
                productos_data = []
                
                for producto in productos_query:
                    # Verificar stock
                    try:
                        # Si existe relación con inventario
                        if hasattr(producto, 'inventario'):
                            stock_actual = producto.inventario.stock if producto.inventario else 0
                        else:
                            # Intenta buscar el inventario manualmente
                            try:
                                inventario = Inventario.objects.get(producto=producto)
                                stock_actual = inventario.stock
                            except Inventario.DoesNotExist:
                                stock_actual = 0
                    except Exception as e:
                        print(f"Error al obtener stock del producto {producto.id}: {e}")
                        stock_actual = 0
                    
                    # Solo incluir productos con stock bajo el umbral
                    if stock_actual <= threshold:
                        productos_data.append({
                            'id': producto.id,
                            'nombre': producto.nombre,
                            'codigo': producto.codigo if hasattr(producto, 'codigo') else None,
                            'precio_compra': str(producto.precio_compra),
                            'precio_venta': str(producto.precio_venta),
                            'stock_actual': stock_actual,
                            'categoria': producto.categoria.nombre if producto.categoria else 'Sin categoría',
                            'sucursal_id': producto.sucursal_id,
                        })
                
                # Incluir información de sucursal en la respuesta
                sucursal_info = None
                if sucursal_id:
                    from Sucursales.models import Sucursal
                    sucursal = Sucursal.objects.filter(id=sucursal_id).first()
                    if sucursal:
                        sucursal_info = {
                            'id': sucursal.id,
                            'nombre': sucursal.nombre
                        }
                
                return Response({
                    'tipo_reporte': 'agotados',
                    'fecha_generacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'threshold': threshold,
                    'total_productos': len(productos_data),
                    'productos': sorted(productos_data, key=lambda x: x['stock_actual']),
                    'sucursal': sucursal_info
                })
                
            else:
                return Response({
                    'error': 'Tipo de reporte no válido',
                    'tipos_disponibles': ['inventario', 'agotados']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Error en ReporteProductosView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


