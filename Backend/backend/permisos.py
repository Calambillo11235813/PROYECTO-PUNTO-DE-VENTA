from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Empleado, Permisos
from django.shortcuts import get_object_or_404
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Añade esta función como alias para mantener compatibilidad
def requiere_privilegio(permiso_nombre):
    """Alias para requiere_permiso para mantener compatibilidad"""
    return requiere_permiso(permiso_nombre)

def requiere_permiso(permiso_nombre):
    """
    Decorador que verifica si el empleado tiene el permiso necesario para la acción.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            try:
                logger.debug(f"Verificando permiso '{permiso_nombre}' para {request.path}")
                
                # Verificar que el permiso existe
                if not Permisos.objects.filter(nombre=permiso_nombre).exists():
                    logger.warning(f"Permiso '{permiso_nombre}' no existe en la base de datos")
                
                if not request.user.is_authenticated:
                    logger.warning(f"Usuario no autenticado intentando acceder a ruta protegida")
                    return Response(
                        {"error": "No autenticado"}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Si el usuario es un administrador de sistema, permitir todo
                if request.user.is_superuser:
                    logger.debug(f"Usuario {request.user} es superusuario, acceso concedido")
                    return view_func(self, request, *args, **kwargs)
                
                # Buscar si el usuario es un empleado
                empleado = Empleado.objects.filter(correo=request.user.correo).first()
                
                if not empleado:
                    logger.warning(f"No se encontró empleado para el usuario {request.user}")
                    return Response(
                        {"error": "No tienes un empleado asociado"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                if not empleado.rol:
                    logger.warning(f"Empleado {empleado.id} no tiene rol asignado")
                    return Response(
                        {"error": "No tienes un rol asignado"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Verificar si el rol tiene el permiso requerido
                tiene_permiso = empleado.rol.permisos.filter(nombre=permiso_nombre).exists()
                
                if not tiene_permiso:
                    logger.warning(f"Empleado {empleado.id} con rol {empleado.rol.nombre_rol} no tiene el permiso '{permiso_nombre}'")
                    return Response(
                        {"error": f"No tienes el permiso: {permiso_nombre}"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                logger.debug(f"Permiso '{permiso_nombre}' verificado correctamente para {request.user}")
                return view_func(self, request, *args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error al verificar permisos: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Error al verificar permisos: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return wrapper
    return decorator

class VerificarPermisosEmpleado(APIView):
    def get(self, request, empleado_id, permiso_nombre=None):
        """Verificar si un empleado tiene un permiso específico"""
        empleado = get_object_or_404(Empleado, id=empleado_id)
        
        if not empleado.rol:
            return Response(
                {"tiene_permiso": False, "mensaje": "El empleado no tiene un rol asignado"}, 
                status=status.HTTP_200_OK
            )
        
        # Si no se proporciona un permiso específico, listar todos
        if not permiso_nombre:
            permisos = empleado.rol.permisos.all()
            permisos_lista = [
                {
                    "id": permiso.id,
                    "nombre": permiso.nombre,
                    "descripcion": permiso.descripcion
                }
                for permiso in permisos
            ]
            return Response({
                "empleado_id": empleado.id,
                "nombre": empleado.nombre,
                "rol": empleado.rol.nombre_rol,
                "permisos": permisos_lista
            })
        
        # Verificar si tiene un permiso específico
        tiene_permiso = empleado.rol.permisos.filter(nombre=permiso_nombre).exists()
        
        return Response({
            "empleado_id": empleado.id,
            "nombre": empleado.nombre,
            "rol": empleado.rol.nombre_rol,
            "permiso_solicitado": permiso_nombre,
            "tiene_permiso": tiene_permiso
        })