from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework.exceptions import PermissionDenied
from accounts.services.plan_limits_service import PlanLimitsService
import re

class PlanFeatureMiddleware(MiddlewareMixin):
    """
    Middleware que verifica el acceso a funcionalidades basadas en el plan de suscripción.
    Verifica automáticamente según la URL accedida.
    """
    
    # Mapeo de patrones URL a funcionalidades requeridas
    FEATURE_URL_PATTERNS = {
        r'^/api/inventario/avanzado/': 'inventario_avanzado',
        r'^/api/reportes/': 'reportes_detallados',
        r'^/api/sucursales/(?!listar)': 'multi_sucursal',  # Excluir listar que es para todos
        r'^/api/backup/': 'backup_automatico',
        r'^/api/integraciones/': 'integraciones',
        r'^/api/facturacion/electronica/': 'facturacion_electronica',
    }
    
    def process_request(self, request):
        # Solo verificar en las rutas de API
        if not request.path.startswith('/api/'):
            return None
            
        # Verificar si estamos autenticados
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
            
        # Obtener usuario_id del usuario autenticado
        usuario_id = request.user.id
        
        # Verificar patrones de URL contra características requeridas
        for pattern, feature in self.FEATURE_URL_PATTERNS.items():
            if re.match(pattern, request.path):
                try:
                    PlanLimitsService.check_feature_access(usuario_id, feature)
                except PermissionDenied as e:
                    return JsonResponse(e.detail, status=403)
                    
        return None