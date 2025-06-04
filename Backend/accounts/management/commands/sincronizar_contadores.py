from django.core.management.base import BaseCommand
from accounts.models import Suscripcion, Usuario
from accounts.models import Empleado
from Productos.models import Producto

class Command(BaseCommand):
    help = 'Sincroniza los contadores de uso con los datos reales'

    def handle(self, *args, **kwargs):
        suscripciones = Suscripcion.objects.all()
        for suscripcion in suscripciones:
            usuario_id = suscripcion.usuario_id
            
            # Actualizar contador de empleados
            empleados_count = Empleado.objects.filter(usuario_id=usuario_id).count()
            
            self.stdout.write(self.style.SUCCESS(
                f'Usuario {usuario_id}: Empleados en BD: {empleados_count}, '
                f'Contador actual: {suscripcion.empleados_utilizados}'
            ))
            
            # Actualizar contador si es diferente
            if suscripcion.empleados_utilizados != empleados_count:
                suscripcion.empleados_utilizados = empleados_count
                suscripcion.save()
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Contador de empleados actualizado a {empleados_count}'
                ))
            
            # Actualizar contador de productos
            productos_count = Producto.objects.filter(usuario_id=usuario_id).count()
            
            self.stdout.write(self.style.SUCCESS(
                f'Usuario {usuario_id}: Productos en BD: {productos_count}, '
                f'Contador actual: {suscripcion.productos_utilizados}'
            ))
            
            # Actualizar contador si es diferente
            if suscripcion.productos_utilizados != productos_count:
                suscripcion.productos_utilizados = productos_count
                suscripcion.save()
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Contador de productos actualizado a {productos_count}'
                ))