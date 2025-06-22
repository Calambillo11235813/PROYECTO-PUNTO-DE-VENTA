from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from Sucursales.models import Sucursal
from Sucursales.serializers import SucursalSerializer
from rest_framework.permissions import AllowAny
class SucursalListCreateAPIView(APIView):
    permission_classes = [AllowAny]
    """
    GET: Lista todas las sucursales
    POST: Crea una nueva sucursal
    """
    def get(self, request):
        sucursales = Sucursal.objects.all()
        serializer = SucursalSerializer(sucursales, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = SucursalSerializer(data=request.data)
        if serializer.is_valid():
            sucursal = serializer.save()
            return Response(SucursalSerializer(sucursal).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SucursalDetailAPIView(APIView):
    """
    GET: Obtiene detalles de una sucursal específica del usuario autenticado
    PUT: Actualiza una sucursal existente del usuario autenticado
    DELETE: Elimina una sucursal del usuario autenticado
    """
    permission_classes = [AllowAny]
    def get(self, request, sucursal_id):
        sucursal = get_object_or_404(Sucursal, id=sucursal_id, usuario=request.user)
        serializer = SucursalSerializer(sucursal)
        return Response(serializer.data)
    
    def put(self, request, sucursal_id):
        sucursal = get_object_or_404(Sucursal, id=sucursal_id, usuario=request.user)
        serializer = SucursalSerializer(sucursal, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, sucursal_id):
        sucursal = get_object_or_404(Sucursal, id=sucursal_id, usuario=request.user)
        if sucursal.productos.exists() or sucursal.cajas.exists() or sucursal.pedidos.exists():
            return Response(
                {"error": "No se puede eliminar esta sucursal porque tiene datos asociados"},
                status=status.HTTP_400_BAD_REQUEST
            )
        sucursal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)