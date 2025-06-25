from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ..models import Usuario, Pedido
from ..services.siat_service import SIATService
import traceback

class AnularFacturaAPIView(APIView):
    """
    POST: Anula una factura en el SIAT
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, usuario_id, pedido_id):
        try:
            print(f"🗑️ Iniciando anulación de factura - Pedido {pedido_id}, Usuario {usuario_id}")
            
            # Obtener usuario y pedido
            usuario = get_object_or_404(Usuario, id=usuario_id)
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            
            print(f"👤 Empresa: {usuario.razon_social or usuario.nombre_empresa} (NIT: {usuario.nit_empresa})")
            
            # Verificar que el pedido esté facturado
            if not pedido.facturado:
                return Response({
                    'success': False,
                    'error': 'Este pedido no ha sido facturado, no se puede anular',
                    'pedido_id': pedido.id,
                    'estado_actual': 'Sin facturar'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que no esté ya anulado
            if pedido.estado_factura == 'Anulado':
                return Response({
                    'success': False,
                    'error': 'Esta factura ya ha sido anulada previamente',
                    'pedido_id': pedido.id,
                    'cuf': pedido.cuf,
                    'estado_actual': pedido.estado_factura
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que tenga CUF
            if not pedido.cuf:
                return Response({
                    'success': False,
                    'error': 'Factura sin CUF válido, no se puede anular',
                    'pedido_id': pedido.id
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener motivo de anulación
            motivo = request.data.get('motivo', '').strip()
            if len(motivo) < 5:
                return Response({
                    'success': False,
                    'error': 'El motivo de anulación debe tener al menos 5 caracteres',
                    'motivo_recibido': motivo
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"📋 Datos de anulación:")
            print(f"   - CUF a anular: {pedido.cuf}")
            print(f"   - Motivo: {motivo}")
            print(f"   - Estado actual: {pedido.estado_factura}")
            print(f"   - Fecha facturación: {pedido.fecha_facturacion}")
            
            # Crear servicio SIAT
            siat_service = SIATService(usuario=usuario)
            
            # Validar configuración SIAT
            errores = siat_service.validar_configuracion()
            if errores:
                return Response({
                    'success': False,
                    'error': f'Configuración SIAT incompleta para {usuario.razon_social or usuario.nombre_empresa}',
                    'errores': errores,
                    'mensaje': 'Por favor, complete la configuración SIAT en su perfil de usuario'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Anular factura en SIAT
            resultado_anulacion = siat_service.anular_factura(pedido.cuf, motivo)
            
            if resultado_anulacion['success']:
                # Actualizar estado del pedido
                estado_anterior = pedido.estado_factura
                pedido.estado_factura = 'Anulado'
                pedido.save()
                
                print(f"✅ Factura anulada exitosamente - CUF: {pedido.cuf}")
                
                return Response({
                    'success': True,
                    'mensaje': 'Factura anulada exitosamente en el SIAT',
                    'anulacion': {
                        'pedido_id': pedido.id,
                        'cuf': pedido.cuf,
                        'codigo_recepcion': pedido.codigo_recepcion,
                        'motivo': motivo,
                        'fecha_anulacion': timezone.now().isoformat(),
                        'fecha_facturacion_original': pedido.fecha_facturacion.isoformat() if pedido.fecha_facturacion else None,
                        'estado_anterior': estado_anterior,
                        'estado_actual': 'Anulado',
                        'total_anulado': float(pedido.total),
                        'cliente': {
                            'nit': pedido.cliente_nit,
                            'nombre': pedido.cliente_nombre
                        }
                    },
                    'detalles_siat': resultado_anulacion.get('detalles', {}),
                    'empresa': {
                        'nit': usuario.nit_empresa,
                        'razon_social': usuario.razon_social or usuario.nombre_empresa
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': 'Error al anular factura en SIAT',
                    'detalle': resultado_anulacion.get('error', 'Error desconocido'),
                    'factura': {
                        'pedido_id': pedido.id,
                        'cuf': pedido.cuf,
                        'estado_actual': pedido.estado_factura
                    },
                    'motivo': motivo
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Error anulando factura: {str(e)}")
            traceback.print_exc()
            return Response({
                'error': f'Error al anular factura: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)