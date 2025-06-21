from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import Rol, Permisos
from accounts.serializers import RolSerializer, PermisosSerializer

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
        Crea un nuevo rol sin permisos iniciales.
        
        Datos requeridos:
        - nombre_rol: Nombre del rol
        
        Retorna:
        - El rol creado en formato JSON
        - Código HTTP 201 Created si es exitoso
        - Errores de validación si los datos son inválidos
        """
        # Crear una copia de los datos de la solicitud para modificar
        data = request.data.copy()
        
        # Asegurar que no se asignen permisos inicialmente
        if 'permisos' in data and data['permisos']:
            # Se están intentando asignar permisos, lo eliminamos
            data.pop('permisos')
        
        serializer = RolSerializer(data=data)
        if serializer.is_valid():
            # Guardar el rol sin permisos
            rol = serializer.save()
            
            # Crear respuesta personalizada
            response_data = {
                "mensaje": "Rol creado correctamente sin permisos iniciales",
                "rol_creado": RolSerializer(rol).data,
                "permisos_count": 0,
                "permisos": []
            }
            
            # Si el rol incluye un usuario, añadir esa información
            if hasattr(rol, 'usuario') and rol.usuario:
                response_data["usuario_id"] = rol.usuario.id
                response_data["usuario_nombre"] = rol.usuario.nombre
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
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
        
        # Añadir información detallada de los permisos
        permisos = rol.permisos.all()
        permisos_serializer = PermisosSerializer(permisos, many=True)
        
        # Crear respuesta con detalles
        response_data = serializer.data.copy()
        response_data['permisos_detalle'] = permisos_serializer.data
        response_data['permisos_count'] = permisos.count()
        
        return Response(response_data)
    
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
            
            # Obtener información actualizada de permisos
            permisos = rol_actualizado.permisos.all()
            permisos_serializer = PermisosSerializer(permisos, many=True)
            
            return Response({
                "mensaje": "Rol actualizado correctamente",
                "rol": RolSerializer(rol_actualizado).data,
                "permisos_count": permisos.count(),
                "permisos_detalle": permisos_serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """
        Elimina un rol existente.
        
        Parámetros:
        - pk: ID del rol a eliminar
        
        Retorna:
        - Mensaje de confirmación si se elimina correctamente
        - 404 si el rol no existe
        """
        rol = self.get_object(pk)
        nombre = rol.nombre_rol
        rol.delete()
        return Response({
            "mensaje": f"El rol '{nombre}' ha sido eliminado correctamente"
        }, status=status.HTTP_200_OK)

class RolPermisos(APIView):
    """
    Endpoint para gestionar los permisos de un rol específico.
    """
    def get(self, request, pk):
        """
        Obtiene todos los permisos asignados a un rol.
        
        Parámetros:
        - pk: ID del rol
        
        Retorna:
        - Lista detallada de permisos asignados al rol
        """
        rol = get_object_or_404(Rol, pk=pk)
        permisos = rol.permisos.all()
        serializer = PermisosSerializer(permisos, many=True)
        
        return Response({
            "rol_id": rol.id,
            "rol_nombre": rol.nombre_rol,
            "permisos_count": permisos.count(),
            "permisos": serializer.data
        })
    
    def post(self, request, pk):
        """
        Añade permisos a un rol existente.
        
        Parámetros:
        - pk: ID del rol
        
        Datos en el body:
        - permisos: Lista de IDs de permisos a añadir
        
        Retorna:
        - Lista actualizada de permisos del rol
        """
        rol = get_object_or_404(Rol, pk=pk)
        
        if 'permisos' not in request.data:
            return Response({
                "error": "Se requiere una lista de IDs de permisos"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        permisos_ids = request.data['permisos']
        
        # Añadir cada permiso al rol
        for permiso_id in permisos_ids:
            try:
                permiso = Permisos.objects.get(id=permiso_id)
                rol.permisos.add(permiso)
            except Permisos.DoesNotExist:
                return Response({
                    "error": f"El permiso con ID {permiso_id} no existe"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener la lista actualizada de permisos
        permisos = rol.permisos.all()
        serializer = PermisosSerializer(permisos, many=True)
        
        return Response({
            "mensaje": "Permisos añadidos correctamente",
            "rol_id": rol.id,
            "rol_nombre": rol.nombre_rol,
            "permisos_count": permisos.count(),
            "permisos": serializer.data
        })
    
    def delete(self, request, pk):
        """
        Elimina permisos de un rol.
        
        Parámetros:
        - pk: ID del rol
        
        Datos en el body:
        - permisos: Lista de IDs de permisos a eliminar
        
        Retorna:
        - Lista actualizada de permisos del rol
        """
        rol = get_object_or_404(Rol, pk=pk)
        
        if 'permisos' not in request.data:
            return Response({
                "error": "Se requiere una lista de IDs de permisos a eliminar"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        permisos_ids = request.data['permisos']
        
        # Eliminar cada permiso del rol
        for permiso_id in permisos_ids:
            try:
                permiso = Permisos.objects.get(id=permiso_id)
                rol.permisos.remove(permiso)
            except Permisos.DoesNotExist:
                return Response({
                    "error": f"El permiso con ID {permiso_id} no existe"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener la lista actualizada de permisos
        permisos = rol.permisos.all()
        serializer = PermisosSerializer(permisos, many=True)
        
        return Response({
            "mensaje": "Permisos eliminados correctamente",
            "rol_id": rol.id,
            "rol_nombre": rol.nombre_rol,
            "permisos_count": permisos.count(),
            "permisos": serializer.data
        })

class RolesPorUsuario(APIView):
    """
    Endpoint para obtener los roles asociados a un usuario específico.
    """
    def get(self, request, usuario_id):
        """
        Obtiene todos los roles creados/asignados a un usuario específico.
        
        Parámetros:
        - usuario_id: ID del usuario
        
        Retorna:
        - Lista de roles asociados al usuario
        """
        # Asumiendo que el modelo Rol tiene un campo usuario
        roles = Rol.objects.filter(usuario_id=usuario_id)
        serializer = RolSerializer(roles, many=True)
        
        return Response({
            "usuario_id": usuario_id,
            "roles_count": roles.count(),
            "roles": serializer.data
        })
