from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Ventas.models import Cliente
from Ventas.serializers import ClienteSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

class ClienteListCreateAPIView(APIView):
    """
    Vista para listar todos los clientes de un usuario o crear un nuevo cliente
    """
    permission_classes = [AllowAny]
    
    def get(self, request, usuario_id):
        """
        Lista todos los clientes asociados al usuario especificado
        """
        try:
            clientes = Cliente.objects.filter(usuario_id=usuario_id)
            serializer = ClienteSerializer(clientes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener clientes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, usuario_id):
        """
        Crea un nuevo cliente asociado al usuario especificado
        """
        try:
            data = request.data.copy()
            data['usuario'] = usuario_id
            
            # Verificar si ya existe un cliente con el mismo nombre o cédula
            if data.get('cedula_identidad'):
                cliente_existente = Cliente.objects.filter(
                    usuario_id=usuario_id, 
                    cedula_identidad=data['cedula_identidad']
                ).first()
                if cliente_existente:
                    return Response(
                        {"error": f"Ya existe un cliente con la cédula {data['cedula_identidad']}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = ClienteSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {"error": f"Error al crear cliente: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClienteDetailAPIView(APIView):
    """
    Vista para operaciones en un cliente específico: obtener detalles, actualizar o eliminar
    """
    permission_classes = [AllowAny]
    
    def get_object(self, usuario_id, cliente_id):
        """
        Obtiene un cliente específico verificando que pertenezca al usuario
        """
        return get_object_or_404(Cliente, id=cliente_id, usuario_id=usuario_id)
    
    def get(self, request, usuario_id, cliente_id):
        """
        Obtiene detalles de un cliente específico
        """
        try:
            cliente = self.get_object(usuario_id, cliente_id)
            serializer = ClienteSerializer(cliente)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener cliente: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, usuario_id, cliente_id):
        """
        Actualiza un cliente existente (reemplaza todos los campos)
        """
        try:
            cliente = self.get_object(usuario_id, cliente_id)
            data = request.data.copy()
            data['usuario'] = usuario_id  # Asegurar que no se cambie el usuario
            
            # Verificar si el nuevo número de cédula ya existe en otro cliente
            if data.get('cedula_identidad') and data['cedula_identidad'] != cliente.cedula_identidad:
                cliente_existente = Cliente.objects.filter(
                    usuario_id=usuario_id, 
                    cedula_identidad=data['cedula_identidad']
                ).exclude(id=cliente_id).first()
                
                if cliente_existente:
                    return Response(
                        {"error": f"Ya existe otro cliente con la cédula {data['cedula_identidad']}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = ClienteSerializer(cliente, data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar cliente: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, usuario_id, cliente_id):
        """
        Actualiza parcialmente un cliente existente
        """
        try:
            cliente = self.get_object(usuario_id, cliente_id)
            data = request.data.copy()
            
            # Si el usuario está en los datos, asegurar que no cambie
            if 'usuario' in data:
                data['usuario'] = usuario_id
            
            # Verificar si hay un nuevo número de cédula y ya existe
            if 'cedula_identidad' in data and data['cedula_identidad'] != cliente.cedula_identidad:
                cliente_existente = Cliente.objects.filter(
                    usuario_id=usuario_id, 
                    cedula_identidad=data['cedula_identidad']
                ).exclude(id=cliente_id).first()
                
                if cliente_existente:
                    return Response(
                        {"error": f"Ya existe otro cliente con la cédula {data['cedula_identidad']}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = ClienteSerializer(cliente, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar cliente: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, usuario_id, cliente_id):
        """
        Elimina un cliente específico
        """
        try:
            cliente = self.get_object(usuario_id, cliente_id)
            nombre_cliente = cliente.nombre
            cliente.delete()
            
            return Response(
                {"mensaje": f"Cliente '{nombre_cliente}' eliminado correctamente"},
                status=status.HTTP_204_NO_CONTENT
            )
        
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar cliente: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )