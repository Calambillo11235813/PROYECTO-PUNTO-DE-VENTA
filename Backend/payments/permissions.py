from rest_framework.permissions import BasePermission

class IsAuthenticatedOrRegistration(BasePermission):
    """
    Permite acceso a usuarios autenticados o solicitudes marcadas como flujo de registro.
    """
    def has_permission(self, request, view):
        # Permitir si el usuario está autenticado
        if request.user and request.user.is_authenticated:
            return True
        
        # Permitir si es una solicitud de registro
        if request.method == 'POST' and request.data.get('registration_flow') is True:
            return True
        
        return False