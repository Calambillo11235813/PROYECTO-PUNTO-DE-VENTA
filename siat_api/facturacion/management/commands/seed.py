from django.core.management.base import BaseCommand
from facturacion.models import Usuario, Token, Cuis, Cufd, Factura, DetalleFactura
from django.utils import timezone
import uuid

class Command(BaseCommand):
    help = "Poblar la base de datos con datos de prueba"

    def handle(self, *args, **kwargs):
        self.stdout.write("📌 Insertando datos de prueba...")

        # Usamos get_or_create para evitar duplicados
        u1, _ = Usuario.objects.get_or_create(
            nit="1234567890",
            defaults={"usuario": "admin", "clave": "admin123", "codigo_ambiente": "2"}
        )
        u2, _ = Usuario.objects.get_or_create(
            nit="9876543210",
            defaults={"usuario": "usuario2", "clave": "clave456", "codigo_ambiente": "1"}
        )

        # Crear tokens para los usuarios
        t1 = Token.objects.create(usuario=u1, valor=str(uuid.uuid4()))
        t2 = Token.objects.create(usuario=u2, valor=str(uuid.uuid4()))

        # Crear cuis para los usuarios
        cuis1 = Cuis.objects.create(usuario=u1)
        cuis2 = Cuis.objects.create(usuario=u2)

        # Crear cufd para los cuis
        cufd1 = Cufd.objects.create(cuis=cuis1)
        cufd2 = Cufd.objects.create(cuis=cuis2)

        # Crear factura
        factura1 = Factura.objects.create(
            nit_emisor="1234567890",
            nit_receptor="111222333",
            fecha_emision=timezone.now(),
            monto_total=200.00,
            codigo_establecimiento="001",
            codigo_punto_venta="PV01",
            forma_pago="Efectivo",
            cuis=cuis1,
            cufd=cufd1
        )

        # Detalles de la factura
        DetalleFactura.objects.create(
            factura=factura1,
            descripcion="Producto A",
            cantidad=2,
            precio_unitario=50.00,
            impuesto=10.00
        )

        DetalleFactura.objects.create(
            factura=factura1,
            descripcion="Producto B",
            cantidad=1,
            precio_unitario=90.00,
            impuesto=0.00
        )

        self.stdout.write(self.style.SUCCESS("✅ Datos insertados correctamente."))
