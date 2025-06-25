from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Proveedor
from Productos.serializers import ProveedorSerializer
from django.shortcuts import get_object_or_404

class ProveedorListaCrearVista(APIView):
    def get(self, request, usuario_id):
        proveedores = Proveedor.objects.filter(usuario_id=usuario_id)
        serializer = ProveedorSerializer(proveedores, many=True)
        return Response(serializer.data)

    # Ejemplo de JSON esperado:
    # {
    #     "nombre": "Proveedor Ejemplo",
    #     "telefono": "78945612",
    #     "correo": "proveedor@ejemplo.com"
    # }
    def post(self, request, usuario_id):
        data = request.data.copy()
        data['usuario'] = usuario_id
        serializer = ProveedorSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)

class ProveedorDetalleVista(APIView):
    def get(self, request, pk, usuario_id):
        proveedor = get_object_or_404(Proveedor, pk=pk, usuario_id=usuario_id)
        serializer = ProveedorSerializer(proveedor)
        return Response(serializer.data)

    def put(self, request, pk, usuario_id):
        proveedor = get_object_or_404(Proveedor, pk=pk, usuario_id=usuario_id)
        data = request.data.copy()
        data['usuario'] = usuario_id
        serializer = ProveedorSerializer(proveedor, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, usuario_id):
        proveedor = get_object_or_404(Proveedor, pk=pk, usuario_id=usuario_id)
        proveedor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)