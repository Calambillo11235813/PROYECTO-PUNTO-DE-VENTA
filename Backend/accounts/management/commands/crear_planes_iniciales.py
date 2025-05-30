from django.core.management.base import BaseCommand
from accounts.models import Plan

#comando para crear planes iniciales del sistema SaaS
# python manage.py crear_planes_iniciales 

class Command(BaseCommand):
    help = 'Crear planes iniciales del sistema SaaS'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina todos los planes existentes antes de crear nuevos',
        )
    
    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('🗑️  Eliminando planes existentes...')
            Plan.objects.all().delete()
            self.stdout.write(self.style.WARNING('Todos los planes han sido eliminados'))
        
        planes_data = [
            {
                'nombre': 'basico',
                'descripcion': 'Plan básico para pequeños negocios. Incluye funcionalidades esenciales para comenzar.',
                'precio': 299.00,
                'max_productos': 100,
                'max_empleados': 2,
                'max_ventas_mensuales': 500,
                'max_sucursales': 1,
                'max_clientes': 200,
                'tiene_inventario_avanzado': False,
                'tiene_reportes_detallados': False,
                'tiene_multi_sucursal': False,
                'tiene_backup_automatico': False,
                'tiene_api_acceso': False,
                'tiene_soporte_prioritario': False,
                'tiene_integraciones': False,
                'tiene_facturacion_electronica': False,
            },
            {
                'nombre': 'intermedio',
                'descripcion': 'Plan intermedio para negocios en crecimiento. Incluye reportes avanzados y más capacidad.',
                'precio': 599.00,
                'max_productos': 500,
                'max_empleados': 5,
                'max_ventas_mensuales': 2000,
                'max_sucursales': 2,
                'max_clientes': 1000,
                'tiene_inventario_avanzado': True,
                'tiene_reportes_detallados': True,
                'tiene_multi_sucursal': True,
                'tiene_backup_automatico': True,
                'tiene_api_acceso': False,
                'tiene_soporte_prioritario': True,
                'tiene_integraciones': False,
                'tiene_facturacion_electronica': True,
            },
            {
                'nombre': 'avanzado',
                'descripcion': 'Plan empresarial con todas las funcionalidades. Sin límites en productos y ventas.',
                'precio': 1299.00,
                'max_productos': 0,  # Ilimitado
                'max_empleados': 20,
                'max_ventas_mensuales': 0,  # Ilimitado
                'max_sucursales': 10,
                'max_clientes': 0,  # Ilimitado
                'tiene_inventario_avanzado': True,
                'tiene_reportes_detallados': True,
                'tiene_multi_sucursal': True,
                'tiene_backup_automatico': True,
                'tiene_api_acceso': True,
                'tiene_soporte_prioritario': True,
                'tiene_integraciones': True,
                'tiene_facturacion_electronica': True,
            }
        ]
        
        self.stdout.write('🚀 Iniciando creación de planes...')
        
        for plan_data in planes_data:
            plan, created = Plan.objects.get_or_create(
                nombre=plan_data['nombre'],
                defaults=plan_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Plan "{plan.get_nombre_display()}" creado exitosamente')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Plan "{plan.get_nombre_display()}" ya existe')
                )
        
        self.stdout.write(
            self.style.SUCCESS('🎉 Proceso de creación de planes completado')
        )