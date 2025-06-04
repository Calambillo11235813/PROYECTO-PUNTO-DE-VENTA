from django.db.models.signals import post_delete
from django.dispatch import receiver
from accounts.services.plan_limits_service import PlanLimitsService
from Productos.models import Producto
from accounts.models import Empleado, Usuario
import logging

# Configurar logger
logger = logging.getLogger(__name__)

# Señal para decrementar contador de productos al eliminar
@receiver(post_delete, sender=Producto)
def decrement_product_usage(sender, instance, **kwargs):
    try:
        usuario_id = instance.usuario_id
        logger.info(f"Señal post_delete activada para Producto {instance.id} de usuario {usuario_id}")
        PlanLimitsService.release_product_usage(usuario_id)
        logger.info(f"Contador de productos decrementado para usuario {usuario_id}")
    except Exception as e:
        logger.error(f"Error decrementando uso de producto: {str(e)}")
        print(f"Error decrementando uso de producto: {str(e)}")

# Señal para decrementar contador de empleados al eliminar
@receiver(post_delete, sender=Empleado)
def decrement_employee_usage(sender, instance, **kwargs):
    try:
        usuario_id = instance.usuario_id
        logger.info(f"Señal post_delete activada para Empleado {instance.id} de usuario {usuario_id}")
        PlanLimitsService.release_employee_usage(usuario_id)
        logger.info(f"Contador de empleados decrementado para usuario {usuario_id}")
    except Exception as e:
        logger.error(f"Error decrementando uso de empleado: {str(e)}")
        print(f"Error decrementando uso de empleado: {str(e)}")

# Añadir este print para verificar que el archivo se está cargando
print("¡Señales de accounts registradas correctamente!")