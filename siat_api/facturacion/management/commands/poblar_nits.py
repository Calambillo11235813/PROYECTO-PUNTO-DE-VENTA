from django.core.management.base import BaseCommand
from facturacion.models import Cliente

#python manage.py poblar_nits
class Command(BaseCommand):
    help = 'Puebla la base de datos con NITs de prueba'

    def handle(self, *args, **options):
        nits_prueba = [
            {'nit': '1234567', 'nombre': 'Juan Pérez Rodríguez'},
            {'nit': '2345678', 'nombre': 'María García López'},
            {'nit': '3456789', 'nombre': 'Carlos Mamani Quispe'},
            {'nit': '4567890', 'nombre': 'Ana Fernández Silva'},
            {'nit': '5678901', 'nombre': 'Luis Morales Vargas'},
            {'nit': '6789012', 'nombre': 'Sofia Mendoza Cruz'},
            {'nit': '7890123', 'nombre': 'Pedro Gutierrez Flores'},
            {'nit': '8901234', 'nombre': 'Carmen Rodriguez Paz'},
            {'nit': '9012345', 'nombre': 'Miguel Angel Torrez'},
            {'nit': '1357924', 'nombre': 'Empresa ABC S.R.L.', 'tipo': 'EMPRESA'},
            {'nit': '2468135', 'nombre': 'Comercial XYZ LTDA', 'tipo': 'EMPRESA'},
        ]
        
        for datos in nits_prueba:
            cliente, created = Cliente.objects.get_or_create(
                nit=datos['nit'],
                defaults={
                    'nombre': datos['nombre'],
                    'tipo_contribuyente': datos.get('tipo', 'PERSONA NATURAL'),
                    'estado': 'ACTIVO'
                }
            )
            if created:
                self.stdout.write(f"✅ Creado: {cliente.nit} - {cliente.nombre}")
            else:
                self.stdout.write(f"⚠️ Ya existe: {cliente.nit}")
                
        self.stdout.write("🎯 Población completada")