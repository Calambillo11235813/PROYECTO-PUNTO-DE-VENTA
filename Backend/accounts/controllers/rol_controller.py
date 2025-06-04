from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import Rol, Usuario
from accounts.serializers import RolSerializer

class RolListCreate(APIView):
    def get(self, request):
        """
        Obtiene la lista de roles, opcionalmente filtrados por usuario creador.
        
        Parámetros:
        - usuario_id (opcional): Si se proporciona, filtra los roles creados por ese usuario
        
        Retorna:
        - Lista de roles en formato JSON
        """
        # Verificar si hay parámetro de usuario_id en la URL
        usuario_id = request.query_params.get('usuario_id')
        
        if usuario_id:
            # Filtrar roles por usuario creador
            roles = Rol.objects.filter(usuario_id=usuario_id)
            serializer = RolSerializer(roles, many=True)
            return Response(serializer.data)
        else:
            # Devolver todos los roles si no se especifica usuario_id
            roles = Rol.objects.all()
            serializer = RolSerializer(roles, many=True)
            return Response(serializer.data)

    def post(self, request):
        """
        Crea un nuevo rol.
        
        Datos requeridos:
        - nombre_rol: Nombre del rol
        - usuario: ID del usuario creador
        - permisos (opcional): Lista de IDs de permisos a asignar
        
        Retorna:
        - El rol creado en formato JSON
        - Código HTTP 201 Created si es exitoso
        - Errores de validación si los datos son inválidos
        """
        # Usamos los datos tal como vienen en la solicitud, sin sobrescribir
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            rol = serializer.save()
            # Devolvemos un objeto más completo con información adicional
            return Response({
                "mensaje": "Rol creado correctamente",
                "rol_creado": RolSerializer(rol).data,
                "usuario_id": rol.usuario.id,
                "usuario_nombre": rol.usuario.nombre,
                "cantidad_roles": Rol.objects.filter(usuario_id=rol.usuario.id).count(),
                "roles_usuario": RolSerializer(Rol.objects.filter(usuario_id=rol.usuario.id), many=True).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RolDetail(APIView):
    def get_object(self, pk):
        """
        Método auxiliar para obtener un rol por su ID.
        Si el rol no existe, retorna 404.
        """
        return get_object_or_404(Rol, pk=pk)
        
    def get(self, request, pk):
        """
        Obtiene un rol específico por su ID.
        
        Parámetros:
        - pk: ID del rol a obtener
        
        Retorna:
        - Detalles del rol en formato JSON
        - 404 si el rol no existe
        """
        rol = self.get_object(pk)
        serializer = RolSerializer(rol)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """
        Actualiza un rol existente.
        
        Parámetros:
        - pk: ID del rol a actualizar
        
        Datos modificables:
        - nombre_rol: Nombre del rol
        - permisos: Lista de IDs de permisos
        
        Retorna:
        - El rol actualizado en formato JSON
        - Errores de validación si los datos son inválidos
        - 404 si el rol no existe
        """
        rol = self.get_object(pk)
        serializer = RolSerializer(rol, data=request.data, partial=True)
        if serializer.is_valid():
            rol_actualizado = serializer.save()
            return Response(RolSerializer(rol_actualizado).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """
        Elimina un rol existente.
        
        Parámetros:
        - pk: ID del rol a eliminar
        
        Retorna:
        - 204 No Content si la eliminación es exitosa
        - 404 si el rol no existe
        """
        rol = self.get_object(pk)
        rol.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RolesPorUsuario(APIView):
    def get(self, request, usuario_id):
        """
        Obtiene todos los roles creados por un usuario específico.
        
        Parámetros:
        - usuario_id: ID del usuario creador
        
        Retorna:
        - JSON con información del usuario y sus roles creados
        - Incluye: ID del usuario, nombre, cantidad de roles y lista detallada
        - 404 si el usuario no existe
        - 500 si ocurre un error inesperado
        """
        try:
            # Verificar que el usuario existe
            usuario = get_object_or_404(Usuario, id=usuario_id)
            
            # Obtener roles creados por este usuario
            roles = Rol.objects.filter(usuario=usuario)
            
            serializer = RolSerializer(roles, many=True)
            
            return Response({
                "usuario_id": usuario_id,
                "usuario_nombre": usuario.nombre,
                "cantidad_roles": roles.count(),
                "roles": serializer.data
            })
            
        except Exception as e:
            return Response({
                "error": f"Error al obtener roles: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
