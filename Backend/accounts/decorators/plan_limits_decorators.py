from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from accounts.services.plan_limits_service import PlanLimitsService

def check_product_limit(view_func):
    """Decorador que verifica el límite de productos antes de procesar la vista"""
    @wraps(view_func)
    def _wrapped_view(self, request, usuario_id, *args, **kwargs):
        try:
            PlanLimitsService.check_product_limit(usuario_id)
        except PermissionDenied as e:
            # Asegúrate de que el mensaje sea claro y útil
            raise PermissionDenied(
                "Has alcanzado el límite de productos disponibles en tu plan actual. "
                "Para continuar agregando productos, considera actualizar a un plan superior."
            )
        return view_func(self, request, usuario_id, *args, **kwargs)
    return _wrapped_view

def check_employee_limit(view_func):
    """Decorador que verifica el límite de empleados antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, usuario_id, *args, **kwargs):
        try:
            # Usar el usuario_id del parámetro, no de request.user
            PlanLimitsService.check_employee_limit(usuario_id)
            return view_func(self, request, usuario_id, *args, **kwargs)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def check_branch_limit(view_func):
    """Decorador que verifica el límite de sucursales antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, *args, **kwargs):
        try:
            usuario_id = request.user.id
            PlanLimitsService.check_branch_limit(usuario_id)
            return view_func(self, request, *args, **kwargs)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def check_sale_limit(view_func):
    """Decorador que verifica el límite de ventas antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, *args, **kwargs):
        try:
            usuario_id = request.user.id
            PlanLimitsService.check_sale_limit(usuario_id)
            return view_func(self, request, *args, **kwargs)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def check_client_limit(view_func):
    """Decorador que verifica el límite de clientes antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, *args, **kwargs):
        try:
            usuario_id = request.user.id
            PlanLimitsService.check_client_limit(usuario_id)
            return view_func(self, request, *args, **kwargs)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def register_resource_usage(resource_type):
    """
    Decorador genérico que registra el uso de un recurso después de procesar la vista
    
    resource_type puede ser: 'product', 'employee', 'client', 'sale'
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self, request, usuario_id=None, *args, **kwargs):
            # Solo para métodos POST (creación de recursos)
            if request.method != 'POST':
                return view_func(self, request, usuario_id, *args, **kwargs)
                
            # Ejecutar la vista original
            response = view_func(self, request, usuario_id, *args, **kwargs)
            
            # Si la vista fue exitosa, registrar el uso
            if response.status_code in [200, 201]:
                try:
                    # Usar usuario_id del parámetro si está disponible, sino del request.user
                    user_id = usuario_id if usuario_id else request.user.id
                    if resource_type == 'product':
                        PlanLimitsService.register_product_usage(user_id)
                    elif resource_type == 'employee':
                        PlanLimitsService.register_employee_usage(user_id)
                    elif resource_type == 'client':
                        PlanLimitsService.register_client_usage(user_id)
                    elif resource_type == 'sale':
                        PlanLimitsService.register_sale_usage(user_id)
                except Exception as e:
                    # No fallamos la operación, solo registramos el error
                    print(f"Error registrando uso de {resource_type}: {str(e)}")
                    
            return response
        return wrapped_view
    return decorator