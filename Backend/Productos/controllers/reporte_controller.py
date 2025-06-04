from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Producto, Inventario, Categoria
from Productos.serializers import ProductoSerializer, InventarioSerializer
from django.db.models import Sum, Count, Avg, F
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta
from django.utils import timezone

class ReporteProductosView(APIView):
    """
    Vista para generar reportes de productos
    """
    
    def get(self, request, usuario_id):
        """
        Generar reporte de productos con diferentes filtros
        """
        # Obtener los parámetros de consulta
        tipo_reporte = request.query_params.get('tipo', 'inventario')
        categoria_id = request.query_params.get('categoria')
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        # Base query - productos del usuario
        productos = Producto.objects.filter(usuario_id=usuario_id)
        
        # Aplicar filtros según los parámetros
        if categoria_id and categoria_id.isdigit():
            productos = productos.filter(categoria_id=int(categoria_id))
            print(f"🔍 Filtrando por categoría ID: {categoria_id}")
        
        # Generar datos según el tipo de reporte
        if tipo_reporte == 'inventario':
            data = self._generar_reporte_inventario(productos, categoria_id, usuario_id)
        elif tipo_reporte == 'categorias':
            data = self._generar_reporte_categorias(productos, categoria_id, usuario_id)
        else:
            return Response({
                'error': f'Tipo de reporte no válido: {tipo_reporte}',
                'tipos_validos': ['inventario', 'categorias']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Retornar datos JSON
        return Response(data)
    
    def _generar_reporte_inventario(self, productos, categoria_id, usuario_id):
        """Generar datos para reporte de inventario"""
        productos_data = []
        for producto in productos:
            try:
                inventario = producto.inventario
                producto_data = ProductoSerializer(producto).data
                producto_data['inventario'] = {
                    'stock': inventario.stock,
                    'cantidad_minima': inventario.cantidad_minima,
                    'cantidad_maxima': inventario.cantidad_maxima,
                    'estado': 'Bajo' if inventario.stock < inventario.cantidad_minima else 
                             'Exceso' if inventario.stock > inventario.cantidad_maxima else 'Normal'
                }
                productos_data.append(producto_data)
            except Exception as e:
                print(f"Error al procesar producto {producto.id}: {e}")
        
        # Obtener información de la categoría si se filtró
        categoria_info = None
        if categoria_id and categoria_id.isdigit():
            try:
                categoria = Categoria.objects.get(id=int(categoria_id), usuario_id=usuario_id)
                categoria_info = {
                    'id': categoria.id,
                    'nombre': categoria.nombre,
                    'descripcion': getattr(categoria, 'descripcion', '')
                }
            except Categoria.DoesNotExist:
                categoria_info = None
            
        return {
            'tipo_reporte': 'inventario',
            'fecha_generacion': timezone.now(),
            'total_productos': len(productos_data),
            'categoria_filtro': categoria_id,
            'categoria_info': categoria_info,
            'productos': productos_data
        }
    
    def _generar_reporte_categorias(self, productos, categoria_id, usuario_id):
        """Generar datos para reporte por categorías"""
        if categoria_id and categoria_id.isdigit():
            categorias = Categoria.objects.filter(usuario_id=usuario_id, id=int(categoria_id))
        else:
            categorias = Categoria.objects.filter(usuario_id=usuario_id)
            
        reporte_categorias = []
        
        for categoria in categorias:
            productos_categoria = productos.filter(categoria=categoria)
            total_productos = productos_categoria.count()
            
            if total_productos > 0:
                stock_total = 0
                valor_total_inventario = 0
                productos_con_stock = []
                productos_bajo_stock = 0
                
                for producto in productos_categoria:
                    if hasattr(producto, 'inventario'):
                        stock_actual = producto.inventario.stock
                        stock_total += stock_actual
                        valor_total_inventario += stock_actual * float(producto.precio_venta)
                        
                        if stock_actual < producto.inventario.cantidad_minima:
                            productos_bajo_stock += 1
                        
                        productos_con_stock.append({
                            'id': producto.id,
                            'nombre': producto.nombre,
                            'stock': stock_actual,
                            'stock_minimo': producto.inventario.cantidad_minima,
                            'precio_venta': float(producto.precio_venta),
                            'valor_stock': stock_actual * float(producto.precio_venta),
                            'estado': 'Bajo' if stock_actual < producto.inventario.cantidad_minima else 
                                     'Exceso' if stock_actual > producto.inventario.cantidad_maxima else 'Normal'
                        })
                
                reporte_categorias.append({
                    'categoria': {
                        'id': categoria.id,
                        'nombre': categoria.nombre,
                        'descripcion': getattr(categoria, 'descripcion', '')
                    },
                    'resumen': {
                        'total_productos': total_productos,
                        'productos_bajo_stock': productos_bajo_stock,
                        'stock_total': stock_total,
                        'stock_promedio': round(stock_total / total_productos, 2) if total_productos > 0 else 0,
                        'valor_total_inventario': valor_total_inventario,
                        'valor_promedio_producto': round(valor_total_inventario / total_productos, 2) if total_productos > 0 else 0
                    },
                    'productos': productos_con_stock
                })
        
        return {
            'tipo_reporte': 'categorias',
            'fecha_generacion': timezone.now(),
            'total_categorias': len(reporte_categorias),
            'categoria_filtro': categoria_id,
            'categorias': reporte_categorias
        }