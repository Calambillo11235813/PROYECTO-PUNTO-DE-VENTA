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
    def wrapped_view(self, request, usuario_id=None, *args, **kwargs):
        try:
            # Usar usuario_id del parámetro si está disponible, sino del request.user
            user_id = usuario_id if usuario_id else request.user.id
            PlanLimitsService.check_product_limit(user_id)
            return view_func(self, request, usuario_id, *args, **kwargs)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def check_employee_limit(view_func):
    """Decorador que verifica el límite de empleados antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, usuario_id, *args, **kwargs):
        print("Decorador check_employee_limit ejecutado para usuario:", usuario_id)
        try:
            PlanLimitsService.check_employee_limit(usuario_id)
            return view_func(self, request, usuario_id, *args, **kwargs)
        except PermissionDenied as e:
            print("Decorador atrapó PermissionDenied:", e.detail)
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
    return wrapped_view

def check_branch_limit(view_func):
    """Decorador que verifica el límite de sucursales antes de procesar la vista"""
    @wraps(view_func)
    def wrapped_view(self, request, *args, **kwargs):
        try:
            # Verificar si el usuario está autenticado
            if request.user.is_authenticated:
                usuario_id = request.user.id
            else:
                # Comportamiento de desarrollo (igual que en tu vista)
                from django.contrib.auth import get_user_model
                User = get_user_model()
                primer_usuario = User.objects.first()
                if primer_usuario:
                    usuario_id = primer_usuario.id
                else:
                    return Response(
                        {"error": "No hay usuarios en el sistema para verificar límites"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Verificar límite antes de proceder
            PlanLimitsService.check_branch_limit(usuario_id)
            
            # Ejecutar la vista original
            response = view_func(self, request, *args, **kwargs)
            
            # Si la creación fue exitosa, registrar el uso de sucursal
            if request.method == 'POST' and response.status_code == status.HTTP_201_CREATED:
                try:
                    # No hay un método específico en PlanLimitsService para sucursales,
                    # pero podemos agregarlo o usar un enfoque personalizado aquí
                    # Incrementar el contador de sucursales en la suscripción
                    from accounts.models import Suscripcion
                    suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
                    if hasattr(suscripcion, 'sucursales_utilizadas'):
                        suscripcion.sucursales_utilizadas += 1
                        suscripcion.save()
                except Exception as e:
                    # Loggear el error pero no fallar la operación
                    print(f"Error registrando uso de sucursal: {str(e)}")
                    
            return response
            
        except PermissionDenied as e:
            # Asegurarse de que el mensaje de error sea el de la excepción original
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

def unregister_branch_usage(view_func):
    """Decorador que decrementa el contador de sucursales después de eliminar una"""
    @wraps(view_func)
    def wrapped_view(self, request, sucursal_id, *args, **kwargs):
        # Primero obtenemos la sucursal para saber a qué usuario pertenece
        from Sucursales.models import Sucursal
        try:
            sucursal = Sucursal.objects.get(id=sucursal_id)
            usuario_id = sucursal.usuario.id
            
            # Ejecutamos la vista original (eliminación)
            response = view_func(self, request, sucursal_id, *args, **kwargs)
            
            # Si la eliminación fue exitosa, decrementar el contador
            if response.status_code == status.HTTP_204_NO_CONTENT:
                try:
                    # Decrementar contador en la suscripción
                    from accounts.models import Suscripcion
                    suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
                    if hasattr(suscripcion, 'sucursales_utilizadas') and suscripcion.sucursales_utilizadas > 0:
                        suscripcion.sucursales_utilizadas -= 1
                        suscripcion.save()
                        print(f"Contador de sucursales decrementado para usuario {usuario_id}")
                except Exception as e:
                    # Loggear el error pero no fallar la operación
                    print(f"Error decrementando contador de sucursales: {str(e)}")
            
            return response
            
        except Sucursal.DoesNotExist:
            # Si la sucursal no existe, solo devolvemos 404
            return Response(
                {"error": "La sucursal no existe"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # Para cualquier otro error, devolvemos un error genérico
            print(f"Error en decorador unregister_branch_usage: {str(e)}")
            return Response(
                {"error": "Ocurrió un error al procesar la solicitud"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return wrapped_view