from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # ✅ AGREGAR ESTA IMPORTACIÓN
from django.shortcuts import get_object_or_404
from django.utils import timezone
from Ventas.models import Pedido
from Ventas.services.siat_service import SIATService
from accounts.models import Usuario
from accounts.utils.logger_utils import get_logger_por_usuario
import traceback

class FacturarPedidoAPIView(APIView):
    """
    POST: Envía un pedido al SIAT para facturación electrónica
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, usuario_id, pedido_id):
        try:
            print(f"🎯 Iniciando facturación de pedido {pedido_id} para usuario {usuario_id}")
            
            # Obtener el usuario y pedido
            usuario = get_object_or_404(Usuario, id=usuario_id)
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            
            print(f"👤 Empresa: {usuario.razon_social or usuario.nombre_empresa} (NIT: {usuario.nit_empresa})")
            
            # ✅ CAPTURAR DATOS DEL CLIENTE DESDE EL REQUEST
            cliente_nit = request.data.get('cliente_nit', '0')
            cliente_nombre = request.data.get('cliente_nombre', '')
            cliente_email = request.data.get('cliente_email', '')
            
            print(f"📥 Datos recibidos del cliente:")
            print(f"   - NIT: {cliente_nit}")
            print(f"   - Nombre: {cliente_nombre or 'NO PROPORCIONADO'}")
            print(f"   - Email: {cliente_email or 'NO PROPORCIONADO'}")
            
            # ✅ CREAR INSTANCIA DEL SERVICIO SIAT
            siat_service = SIATService(usuario=usuario)
            
            # ✅ SI SOLO SE PROPORCIONÓ NIT, BUSCAR DATOS AUTOMÁTICAMENTE
            if cliente_nit and cliente_nit not in ['0', '99001', '99002', '99003'] and not cliente_nombre:
                print(f"🔍 Solo se proporcionó NIT {cliente_nit}, buscando datos del contribuyente...")
                
                # Validar y obtener datos del NIT
                validacion_result = siat_service.validar_nit_contribuyente(cliente_nit)
                
                print(f"📋 Resultado completo de validación: {validacion_result}")
                
                if isinstance(validacion_result, dict) and validacion_result.get('transaccion', False):
                    # NIT válido, extraer datos
                    datos_contribuyente = validacion_result.get('datos', {})
                    nombre_encontrado = datos_contribuyente.get('razonSocial', 'CONTRIBUYENTE VÁLIDO')
                    
                    print(f"✅ Datos encontrados para NIT {cliente_nit}:")
                    print(f"   - Razón Social: {nombre_encontrado}")
                    
                    # ✅ ACTUALIZAR EL NOMBRE DEL CLIENTE CON EL DATO OBTENIDO
                    cliente_nombre = nombre_encontrado
                    
                    # Si hay más datos disponibles, también los podemos usar
                    if 'email' in datos_contribuyente and not cliente_email:
                        cliente_email = datos_contribuyente.get('email', '')
                        
                else:
                    # NIT no válido o error en consulta
                    error_msg = validacion_result.get('error', 'NIT no encontrado en el padrón')
                    print(f"❌ NIT {cliente_nit} no válido: {error_msg}")
                    
                    return Response({
                        'success': False,
                        'error': f'NIT {cliente_nit} no es válido',
                        'detalle': error_msg,
                        'validacion_completa': validacion_result,
                        'mensaje': 'Por favor verifique el NIT del cliente o proporcione el nombre manualmente'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ VALORES FINALES PARA EL CLIENTE (DESPUÉS DE LA BÚSQUEDA)
            cliente_nit_final = cliente_nit if cliente_nit else '0'
            cliente_nombre_final = cliente_nombre if cliente_nombre else 'SIN NOMBRE'
            cliente_email_final = cliente_email if cliente_email else ''
            
            print(f"📋 Datos finales del cliente (DESPUÉS de búsqueda SIAT):")
            print(f"   - NIT: {cliente_nit_final}")
            print(f"   - Nombre: {cliente_nombre_final}")
            print(f"   - Email: {cliente_email_final}")
            
            # ✅ AHORA SÍ ACTUALIZAR EL PEDIDO CON LOS DATOS CORRECTOS
            pedido.cliente_nit = cliente_nit_final
            pedido.cliente_nombre = cliente_nombre_final
            pedido.cliente_email = cliente_email_final
            pedido.save()
            
            print(f"✅ Pedido actualizado con datos del cliente (incluyendo nombre obtenido del SIAT)")
            
            # Verificar que no esté ya facturado
            if pedido.facturado:
                return Response({
                    'error': 'Este pedido ya ha sido facturado',
                    'cuf': pedido.cuf
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar configuración SIAT del usuario
            errores = siat_service.validar_configuracion()
            if errores:
                return Response({
                    'success': False,
                    'error': f'Configuración SIAT incompleta para {usuario.razon_social or usuario.nombre_empresa}',
                    'errores': errores,
                    'mensaje': 'Por favor, complete la configuración SIAT en su perfil de usuario'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Enviar factura
            resultado = siat_service.enviar_factura(pedido)
            
            if resultado['success']:
                # Actualizar el pedido con información de facturación
                pedido.facturado = True
                pedido.cuf = resultado['cuf']
                pedido.codigo_recepcion = resultado['codigo_recepcion']
                pedido.fecha_facturacion = timezone.now()
                pedido.estado_factura = 'Aceptado'
                pedido.save()
                
                try:
                    logger = get_logger_por_usuario(usuario_id)
                    logger.info(f"Factura enviada exitosamente para pedido {pedido_id} - Empresa: {usuario.razon_social}")
                except:
                    print(f"✅ Factura enviada exitosamente para pedido {pedido_id}")
                
                return Response({
                    'success': True,
                    'mensaje': 'Factura enviada exitosamente al SIAT',
                    'cuf': resultado['cuf'],
                    'codigo_recepcion': resultado['codigo_recepcion'],
                    'pedido_id': pedido.id,
                    'empresa': usuario.razon_social or usuario.nombre_empresa,
                    'nit': usuario.nit_empresa,
                    'cliente': {
                        'nit': pedido.cliente_nit,
                        'nombre': pedido.cliente_nombre,
                        'email': pedido.cliente_email,
                        'datos_obtenidos_automaticamente': bool(cliente_nit and not request.data.get('cliente_nombre'))
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': resultado['error'],
                    'empresa': usuario.razon_social or usuario.nombre_empresa
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Error general: {str(e)}")
            traceback.print_exc()
            return Response({
                'error': f'Error al facturar pedido: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerificarEstadoFacturaAPIView(APIView):
    """
    GET: Verifica el estado de una factura en el SIAT
    """
    permission_classes = [AllowAny]  # ✅ AGREGAR ESTA LÍNEA
    authentication_classes = []
    def get(self, request, usuario_id, pedido_id):
        try:
            usuario = get_object_or_404(Usuario, id=usuario_id)
            pedido = get_object_or_404(Pedido, id=pedido_id, usuario_id=usuario_id)
            
            if not pedido.facturado or not pedido.cuf:
                return Response({
                    'error': 'Este pedido no ha sido facturado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            siat_service = SIATService(usuario=usuario)
            resultado = siat_service.verificar_estado_factura(pedido.cuf)
            
            print(f"🔍 Resultado verificación: {resultado}")
            
            # ✅ MEJORAR LA LÓGICA DE VERIFICACIÓN:
            if resultado.get('transaccion') is True:
                # Respuesta exitosa
                estado = resultado.get('estado', 'Desconocido')
                
                # Actualizar estado del pedido
                if pedido.estado_factura != estado:
                    pedido.estado_factura = estado
                    pedido.save()
                
                return Response({
                    'success': True,
                    'estado': estado,
                    'transaccion_exitosa': True,
                    'cuf': pedido.cuf,
                    'codigo_recepcion': pedido.codigo_recepcion,
                    'empresa': usuario.razon_social or usuario.nombre_empresa,
                    'nit': usuario.nit_empresa,
                    'mensaje': f'Estado de factura: {estado}',
                    'fecha_emision': resultado.get('fechaEmision'),
                    'cuis': resultado.get('cuis')
                }, status=status.HTTP_200_OK)
                
            elif 'estado' in resultado:
                # Respuesta con error pero con estado
                estado = resultado.get('estado', 'Error')
                return Response({
                    'success': True,
                    'estado': estado,
                    'transaccion_exitosa': False,
                    'cuf': pedido.cuf,
                    'empresa': usuario.razon_social or usuario.nombre_empresa,
                    'nit': usuario.nit_empresa,
                    'mensaje': f'Estado de factura: {estado}',
                    'error_detalle': resultado.get('error', 'Sin detalles')
                }, status=status.HTTP_200_OK)
            else:
                # Error completo
                return Response({
                    'success': False,
                    'error': resultado.get('error', 'Error desconocido al verificar estado'),
                    'empresa': usuario.razon_social or usuario.nombre_empresa,
                    'nit': usuario.nit_empresa
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Error en verificación: {str(e)}")
            return Response({
                'error': f'Error al verificar estado: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TestSIATConnectionAPIView(APIView):
    """
    GET: Prueba la conexión con el SIAT
    """
    permission_classes = [AllowAny]  # ✅ AGREGAR ESTA LÍNEA
    authentication_classes = []
    def get(self, request, usuario_id):
        try:
            print(f"🧪 Probando conexión SIAT para usuario {usuario_id}")
            
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            siat_service = SIATService(usuario=usuario)
            
            # Validar configuración
            errores = siat_service.validar_configuracion()
            if errores:
                return Response({
                    'success': False,
                    'error': 'Configuración SIAT incompleta',
                    'errores': errores,
                    'empresa': usuario.razon_social or usuario.nombre_empresa,
                    'mensaje': 'Complete los siguientes campos en su perfil de usuario:'
                })
            
            # Probar conexión paso a paso
            print(f"📋 Datos de empresa: {usuario.razon_social} - NIT: {usuario.nit_empresa}")
            
            if siat_service.obtener_token():
                if siat_service.obtener_cuis():
                    if siat_service.obtener_cufd():
                        return Response({
                            'success': True,
                            'mensaje': 'Conexión exitosa con SIAT',
                            'empresa': usuario.razon_social or usuario.nombre_empresa,
                            'nit': usuario.nit_empresa,
                            'ambiente': 'Pruebas' if usuario.codigo_ambiente == '2' else 'Producción',
                            'token': siat_service.token[:20] + "..." if siat_service.token else None,
                            'cuis': siat_service.cuis,
                            'cufd': siat_service.cufd
                        })
                    else:
                        return Response({
                            'success': False,
                            'error': 'Error obteniendo CUFD',
                            'empresa': usuario.razon_social or usuario.nombre_empresa
                        })
                else:
                    return Response({
                        'success': False,
                        'error': 'Error obteniendo CUIS',
                        'empresa': usuario.razon_social or usuario.nombre_empresa
                    })
            else:
                return Response({
                    'success': False,
                    'error': 'Error obteniendo Token. Verifique las credenciales SIAT.',
                    'empresa': usuario.razon_social or usuario.nombre_empresa
                })
                
        except Exception as e:
            print(f"❌ Error en prueba de conexión: {str(e)}")
            traceback.print_exc()
            return Response({
                'success': False,
                'error': f'Error de conexión: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)