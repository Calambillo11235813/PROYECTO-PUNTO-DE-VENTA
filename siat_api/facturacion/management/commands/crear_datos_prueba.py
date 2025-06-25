from django.core.management.base import BaseCommand
from facturacion.models import Usuario

class Command(BaseCommand):
    help = 'Crear datos de prueba para la API SIAT simulada'

    def handle(self, *args, **options):
        # Crear usuario de prueba
        usuario, created = Usuario.objects.get_or_create(
            nit="123456789",
            defaults={
                'clave': 'password123',
                'codigo_ambiente': '2'  # Ambiente de pruebas
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Usuario creado: NIT {usuario.nit}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Usuario ya existe: NIT {usuario.nit}')
            )