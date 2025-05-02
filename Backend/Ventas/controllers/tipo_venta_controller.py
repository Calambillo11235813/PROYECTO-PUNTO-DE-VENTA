from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import TipoVenta
from Ventas.serializers import TipoVentaSerializer
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

class TipoVentaListCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tipos = TipoVenta.objects.all()
        serializer = TipoVentaSerializer(tipos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TipoVentaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TipoVentaRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        return get_object_or_404(TipoVenta, pk=pk)

    def get(self, request, pk):
        tipo = self.get_object(pk)
        serializer = TipoVentaSerializer(tipo)
        return Response(serializer.data)

    def put(self, request, pk):
        tipo = self.get_object(pk)
        serializer = TipoVentaSerializer(tipo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tipo = self.get_object(pk)
        tipo.delete()
        return Response({'mensaje': 'Tipo de venta eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
