from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from ..models import Usuario, Pedido
import traceback

class ListaFacturasUsuarioAPIView(APIView):
    """
    GET: Lista todas las facturas de un usuario/empresa
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request, usuario_id):
        try:
            print(f"📋 Obteniendo todas las facturas para usuario {usuario_id}")
            
            # Obtener usuario
            usuario = get_object_or_404(Usuario, id=usuario_id)
            print(f"👤 Empresa: {usuario.razon_social or usuario.nombre_empresa} (NIT: {usuario.nit_empresa})")
            
            # Obtener todas las facturas del usuario (solo pedidos facturados)
            facturas = Pedido.objects.filter(
                usuario_id=usuario_id,
                facturado=True
            ).order_by('-fecha_facturacion')
            
            print(f"📊 Se encontraron {facturas.count()} facturas")
            
            # Formatear datos
            facturas_data = []
            for factura in facturas:
                facturas_data.append({
                    'pedido_id': factura.id,
                    'cuf': factura.cuf,
                    'codigo_recepcion': factura.codigo_recepcion,
                    'fecha_facturacion': factura.fecha_facturacion.isoformat() if factura.fecha_facturacion else None,
                    'estado': factura.estado_factura,
                    'total': float(factura.total),
                    'cliente_nit': factura.cliente_nit,
                    'cliente_nombre': factura.cliente_nombre,
                    'cliente_email': factura.cliente_email
                })
            
            return Response({
                'success': True,
                'empresa': {
                    'nit': usuario.nit_empresa,
                    'razon_social': usuario.razon_social or usuario.nombre_empresa
                },
                'total_facturas': len(facturas_data),
                'facturas': facturas_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error obteniendo facturas: {str(e)}")
            traceback.print_exc()
            return Response({
                'error': f'Error al obtener facturas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)