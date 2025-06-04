from accounts.utils.logger_utils import get_logger_por_usuario
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Caja, Pedido, MovimientoEfectivo, Transaccion, TipoPago
from accounts.models import Usuario
from Ventas.serializers import CajaSerializer, MovimientoEfectivoSerializer, TransaccionSerializer
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count

class AbrirCajaAPIView(APIView):
    """
    POST: Abre una nueva caja si el usuario no tiene una ya abierta.
    """
    def post(self, request, usuario_id):
        cajas_abiertas = Caja.objects.filter(usuario_id=usuario_id, estado='abierta')
        if cajas_abiertas.exists():
            return Response({"error": "Ya hay una caja abierta para este usuario."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['usuario'] = usuario_id
        serializer = CajaSerializer(data=data)
        if serializer.is_valid():
            caja = serializer.save()
            logger = get_logger_por_usuario(usuario_id)
            logger.info(f"Caja abierta: {caja.id} | Usuario: {caja.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CerrarCajaAPIView(APIView):
    """
    PATCH: Cierra la caja abierta del usuario, calcula totales y monto final.
    """
    def patch(self, request, usuario_id):
        caja = get_object_or_404(Caja, usuario_id=usuario_id, estado='abierta')

        # Fecha de cierre (ahora)
        caja.fecha_cierre = timezone.now()

        # Obtener todas las ventas realizadas durante la caja abierta
        ventas = Pedido.objects.filter(caja=caja)

        # Inicializar contadores
        total_efectivo = 0
        total_qr = 0
        total_tarjeta = 0
        total_devoluciones = 0
        total_ajustes = 0

        for venta in ventas:
            for transaccion in venta.transacciones.all():
                tipo_pago = transaccion.tipo_pago.nombre.lower()
                if tipo_pago == 'efectivo':
                    total_efectivo += transaccion.monto
                elif tipo_pago == 'qr':
                    total_qr += transaccion.monto
                elif tipo_pago == 'tarjeta':
                    total_tarjeta += transaccion.monto

            # Aquí deberías agregar lógica para sumar devoluciones y ajustes asociados a la venta
            # Por ejemplo:
            # total_devoluciones += venta.total_devoluciones
            # total_ajustes += venta.total_ajustes

        # Calcular movimientos de efectivo (ingresos - retiros)
        movimientos = MovimientoEfectivo.objects.filter(caja=caja)
        total_ingresos = sum(m.monto for m in movimientos if m.tipo == 'ingreso')
        total_retiros = sum(m.monto for m in movimientos if m.tipo == 'retiro')
        total_movimiento_efectivo = total_ingresos - total_retiros

        # Asignar valores a la caja
        caja.total_efectivo = total_efectivo
        caja.total_qr = total_qr
        caja.total_tarjeta = total_tarjeta
        caja.total_devoluciones = total_devoluciones
        caja.total_ajustes = total_ajustes
        caja.total_movimiento_efectivo = total_movimiento_efectivo

        # Calcular monto final (solo efectivo + movimientos netos)
        caja.monto_final = caja.monto_inicial + total_efectivo + total_movimiento_efectivo - total_devoluciones + total_ajustes

        # Cerrar caja
        caja.estado = 'cerrada'
        caja.save()

        logger = get_logger_por_usuario(usuario_id)
        logger.info(f"Caja cerrada: {caja.id} | Usuario: {caja.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")

        return Response(CajaSerializer(caja).data, status=status.HTTP_200_OK)

class CajaActualAPIView(APIView):
    """
    GET: Devuelve el estado de la caja abierta del usuario, con totales calculados al momento,
    incluyendo los movimientos de efectivo.
    """
    def get(self, request, usuario_id):
        try:
            caja = Caja.objects.get(usuario_id=usuario_id, estado='abierta')

            # Calcular totales de ventas por tipo de pago
            ventas = Pedido.objects.filter(caja=caja)

            total_efectivo = 0
            total_qr = 0
            total_tarjeta = 0

            for venta in ventas:
                for transaccion in venta.transacciones.all():
                    tipo = transaccion.tipo_pago.nombre.lower()
                    if tipo == 'efectivo':
                        total_efectivo += transaccion.monto
                    elif tipo == 'qr':
                        total_qr += transaccion.monto
                    elif tipo == 'tarjeta':
                        total_tarjeta += transaccion.monto

            # Obtener y calcular movimientos de efectivo
            movimientos = MovimientoEfectivo.objects.filter(caja=caja).order_by('-fecha')
            total_ingresos = sum(m.monto for m in movimientos if m.tipo == 'ingreso')
            total_retiros = sum(m.monto for m in movimientos if m.tipo == 'retiro')
            total_movimiento_efectivo = total_ingresos - total_retiros

            # Serializar la caja y agregar información calculada
            serializer = CajaSerializer(caja)
            data = serializer.data
            data['total_efectivo'] = str(total_efectivo)
            data['total_qr'] = str(total_qr)
            data['total_tarjeta'] = str(total_tarjeta)
            data['total_movimiento_efectivo'] = str(total_movimiento_efectivo)
            data['movimientos_efectivo'] = MovimientoEfectivoSerializer(movimientos, many=True).data

            logger = get_logger_por_usuario(usuario_id)
            logger.info(f"Consulta caja abierta: {caja.id} | Usuario: {caja.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")

            return Response(data)

        except Caja.DoesNotExist:
            return Response({"error": "No hay caja abierta actualmente para este usuario."}, status=404)

class CajaTransaccionesEfectivoAPIView(APIView):
    """
    GET: Obtiene la sumatoria de transacciones en efectivo de ventas realizadas mientras una caja está abierta
    """
    def get(self, request, caja_id):
        try:
            # Verificar que la caja exista
            caja = get_object_or_404(Caja, id=caja_id)
            
            # Buscar el tipo de pago 'efectivo'
            tipo_pago_efectivo = TipoPago.objects.filter(nombre__icontains='efectivo').first()
            
            if not tipo_pago_efectivo:
                return Response(
                    {"error": "No se encontró el tipo de pago 'Efectivo' en el sistema."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener pedidos asociados a esta caja
            pedidos = Pedido.objects.filter(caja=caja)
            
            # Obtener transacciones en efectivo de estos pedidos
            transacciones = Transaccion.objects.filter(
                pedido__in=pedidos,
                tipo_pago=tipo_pago_efectivo
            )
            
            # Serializar las transacciones
            transacciones_data = []
            for transaccion in transacciones:
                transacciones_data.append({
                    'id': transaccion.id,
                    'pedido_id': transaccion.pedido.id,
                    'fecha': transaccion.pedido.fecha.strftime('%Y-%m-%d %H:%M'),
                    'tipo_pago': tipo_pago_efectivo.nombre,
                    'monto': float(transaccion.monto)
                })
            
            # Calcular el total
            total = transacciones.aggregate(total=Sum('monto'))['total'] or 0
            
            return Response({
                'total': float(total),
                'transacciones': transacciones_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error al obtener transacciones en efectivo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
