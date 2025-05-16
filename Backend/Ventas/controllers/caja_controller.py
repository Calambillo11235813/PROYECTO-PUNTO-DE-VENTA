from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Caja,Pedido,MovimientoEfectivo
from accounts.models import Usuario
from Ventas.serializers import CajaSerializer, MovimientoEfectivoSerializer
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.shortcuts import get_object_or_404

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
            serializer.save()
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

            return Response(data)

        except Caja.DoesNotExist:
            return Response({"error": "No hay caja abierta actualmente para este usuario."}, status=404)
