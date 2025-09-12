from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Caja, MovimientoEfectivo
from Ventas.serializers import MovimientoEfectivoSerializer
from django.shortcuts import get_object_or_404

class MovimientoEfectivoAPIView(APIView):
    def post(self, request, caja_id):
        caja = get_object_or_404(Caja, id=caja_id, estado='abierta')
        data = request.data.copy()
        data['caja'] = caja.id
        serializer = MovimientoEfectivoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, caja_id):
        movimientos = MovimientoEfectivo.objects.filter(caja_id=caja_id).order_by('-fecha')
        serializer = MovimientoEfectivoSerializer(movimientos, many=True)
        return Response(serializer.data)
