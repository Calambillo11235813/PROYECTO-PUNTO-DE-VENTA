from django.utils import timezone
from accounts.models import Suscripcion, Usuario
from rest_framework.exceptions import PermissionDenied

class PlanLimitsService:
    """
    Servicio para gestionar los límites de planes de suscripción.
    Centraliza toda la lógica de verificación y aplicación de restricciones.
    """
    
    @staticmethod
    def get_user_subscription(usuario_id):
        """Obtiene la suscripción activa del usuario"""
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            if not suscripcion.esta_activa:
                raise PermissionDenied(
                    {"error": "Suscripción inactiva", 
                     "codigo": "SUBSCRIPTION_INACTIVE",
                     "detalles": "Su suscripción ha expirado o está suspendida."}
                )
            return suscripcion
        except Suscripcion.DoesNotExist:
            raise PermissionDenied(
                {"error": "Usuario sin suscripción", 
                 "codigo": "NO_SUBSCRIPTION",
                 "detalles": "No se encontró una suscripción activa para este usuario."}
            )
    
    @staticmethod
    def check_product_limit(usuario_id):
        """Verifica si el usuario puede agregar más productos según su plan"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        if not suscripcion.verificar_limite_productos():
            raise PermissionDenied(
                {"error": "Límite de productos alcanzado", 
                 "codigo": "PRODUCT_LIMIT_REACHED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} permite un máximo de {suscripcion.plan.max_productos} productos."}
            )
        return True
    
    @staticmethod
    def check_employee_limit(usuario_id):
        """Verifica si el usuario puede agregar más empleados según su plan"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        if not suscripcion.verificar_limite_empleados():
            raise PermissionDenied(
                {"error": "Límite de empleados alcanzado", 
                 "codigo": "EMPLOYEE_LIMIT_REACHED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} permite un máximo de {suscripcion.plan.max_empleados} empleados."}
            )
        return True
    
    @staticmethod
    def check_branch_limit(usuario_id):
        """Verifica si el usuario puede agregar más sucursales según su plan"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        if not suscripcion.verificar_limite_sucursales():
            raise PermissionDenied(
                {"error": "Límite de sucursales alcanzado", 
                 "codigo": "BRANCH_LIMIT_REACHED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} permite un máximo de {suscripcion.plan.max_sucursales} sucursales."}
            )
        return True
    
    @staticmethod
    def check_sale_limit(usuario_id):
        """Verifica si el usuario puede registrar más ventas este mes según su plan"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        if not suscripcion.verificar_limite_ventas_mensuales():
            raise PermissionDenied(
                {"error": "Límite de ventas mensuales alcanzado", 
                 "codigo": "MONTHLY_SALES_LIMIT_REACHED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} permite un máximo de {suscripcion.plan.max_ventas_mensuales} ventas por mes."}
            )
        return True
    
    @staticmethod
    def check_client_limit(usuario_id):
        """Verifica si el usuario puede agregar más clientes según su plan"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        if not suscripcion.verificar_limite_clientes():
            raise PermissionDenied(
                {"error": "Límite de clientes alcanzado", 
                 "codigo": "CLIENT_LIMIT_REACHED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} permite un máximo de {suscripcion.plan.max_clientes} clientes."}
            )
        return True
    
    @staticmethod
    def check_feature_access(usuario_id, feature_name):
        """
        Verifica si el usuario tiene acceso a una funcionalidad específica según su plan
        
        feature_name debe ser uno de:
        - inventario_avanzado
        - reportes_detallados
        - multi_sucursal
        - backup_automatico
        - api_acceso
        - soporte_prioritario
        - integraciones
        - facturacion_electronica
        """
        feature_attr = f"tiene_{feature_name}"
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        
        if not hasattr(suscripcion.plan, feature_attr):
            raise ValueError(f"Característica desconocida: {feature_name}")
        
        if not getattr(suscripcion.plan, feature_attr):
            raise PermissionDenied(
                {"error": f"Acceso no permitido a {feature_name}", 
                 "codigo": f"FEATURE_{feature_name.upper()}_DENIED",
                 "detalles": f"Su plan {suscripcion.plan.nombre} no incluye acceso a {feature_name}."}
            )
        
        return True
    
    # Métodos para incrementar contadores
    @staticmethod
    def register_product_usage(usuario_id):
        """Registra el uso de un producto e incrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        PlanLimitsService.check_product_limit(usuario_id)
        suscripcion.incrementar_uso_productos()
        return True
    
    @staticmethod
    def register_employee_usage(usuario_id):
        """Registra el uso de un empleado e incrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        PlanLimitsService.check_employee_limit(usuario_id)
        suscripcion.incrementar_uso_empleados()
        return True
    
    @staticmethod
    def register_sale_usage(usuario_id):
        """Registra una venta e incrementa el contador mensual"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        PlanLimitsService.check_sale_limit(usuario_id)
        suscripcion.incrementar_ventas_mes()
        return True
    
    @staticmethod
    def register_client_usage(usuario_id):
        """Registra el uso de un cliente e incrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        PlanLimitsService.check_client_limit(usuario_id)
        suscripcion.incrementar_uso_clientes()
        return True
    
    # Métodos para decrementar contadores
    @staticmethod
    def release_product_usage(usuario_id):
        """Libera un producto y decrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        suscripcion.decrementar_uso_productos()
        return True
    
    @staticmethod
    def release_employee_usage(usuario_id):
        """Libera un empleado y decrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        suscripcion.decrementar_uso_empleados()
        return True
    
    @staticmethod
    def release_client_usage(usuario_id):
        """Libera un cliente y decrementa el contador"""
        suscripcion = PlanLimitsService.get_user_subscription(usuario_id)
        suscripcion.decrementar_uso_clientes()
        return True