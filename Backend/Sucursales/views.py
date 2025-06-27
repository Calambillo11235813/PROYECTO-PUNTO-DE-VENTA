from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from Sucursales.models import Sucursal
from Sucursales.serializers import SucursalSerializer
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
# Importar los decoradores necesarios
from accounts.decorators.plan_limits_decorators import check_branch_limit, unregister_branch_usage

User = get_user_model()

class SucursalListCreateAPIView(APIView):
    permission_classes = [AllowAny]
    """
    GET: Lista todas las sucursales (sin filtrar por usuario durante pruebas)
    POST: Crea una nueva sucursal (asignando al primer usuario disponible durante pruebas)
    """
    def get(self, request):
        # Para pruebas, devolver todas las sucursales sin filtrar por usuario
        sucursales = Sucursal.objects.all()
        print(f"Solicitud de lista de sucursales recibida")
        print(f"Total de sucursales en el sistema: {sucursales.count()}")
        
        serializer = SucursalSerializer(sucursales, many=True)
        return Response(serializer.data)
    
    @check_branch_limit
    def post(self, request):
        # Crear una copia de los datos de la solicitud
        data = request.data.copy()
        
        # Verificar si el usuario está autenticado
        if request.user.is_authenticated:
            # Si está autenticado, usar su ID
            print(f"Usuario autenticado: {request.user.id}")
            data['usuario'] = request.user.id
        else:
            # Para pruebas, asignar al primer usuario disponible
            # Esto es solo para desarrollo, no recomendado en producción
            primer_usuario = User.objects.first()
            if primer_usuario:
                print(f"Asignando al primer usuario disponible: {primer_usuario.id}")
                data['usuario'] = primer_usuario.id
            else:
                return Response(
                    {"error": "No hay usuarios en el sistema para asignar a la sucursal"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = SucursalSerializer(data=data)
        if serializer.is_valid():
            sucursal = serializer.save()
            return Response(SucursalSerializer(sucursal).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SucursalDetailAPIView(APIView):
    """
    GET: Obtiene detalles de una sucursal específica
    PUT: Actualiza una sucursal existente
    DELETE: Elimina una sucursal
    """
    permission_classes = [AllowAny]
    
    def get(self, request, sucursal_id):
        # Para pruebas, no filtrar por usuario
        sucursal = get_object_or_404(Sucursal, id=sucursal_id)
        serializer = SucursalSerializer(sucursal)
        return Response(serializer.data)
    
    def put(self, request, sucursal_id):
        # Para pruebas, no filtrar por usuario
        sucursal = get_object_or_404(Sucursal, id=sucursal_id)
        serializer = SucursalSerializer(sucursal, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @unregister_branch_usage
    def delete(self, request, sucursal_id):
        # Para pruebas, no filtrar por usuario
        sucursal = get_object_or_404(Sucursal, id=sucursal_id)
        
        # Mantener las verificaciones de relaciones
        if sucursal.productos.exists() or sucursal.cajas.exists() or sucursal.pedidos.exists():
            return Response(
                {"error": "No se puede eliminar esta sucursal porque tiene datos asociados"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        sucursal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SucursalesPorUsuarioAPIView(APIView):
    """
    GET: Obtiene todas las sucursales de un usuario específico
    """
    permission_classes = [AllowAny]
    
    def get(self, request, usuario_id):
        # Verificar si el usuario existe
        usuario = get_object_or_404(User, id=usuario_id)
        
        # Obtener todas las sucursales del usuario
        sucursales = Sucursal.objects.filter(usuario=usuario)
        print(f"Obteniendo sucursales del usuario {usuario_id} ({usuario.correo})")
        print(f"Total de sucursales encontradas: {sucursales.count()}")
        
        serializer = SucursalSerializer(sucursales, many=True)
        return Response(serializer.data)


