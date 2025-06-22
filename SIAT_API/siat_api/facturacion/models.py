# facturacion/models.py
from django.db import models
import uuid

class Usuario(models.Model):
    nit = models.CharField(max_length=20, unique=True)  # <- esto será el username en la llamada
    clave = models.CharField(max_length=50)             # <- será el password
    codigo_ambiente = models.CharField(max_length=10)


class Token(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    valor = models.CharField(max_length=255)
    creado_en = models.DateTimeField(auto_now_add=True)

class Cuis(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    codigo = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    creado_en = models.DateTimeField(auto_now_add=True)

class Cufd(models.Model):
    cuis = models.ForeignKey(Cuis, on_delete=models.CASCADE)
    codigo = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    codigo_control = models.CharField(max_length=30)
    fecha_vigencia = models.DateTimeField()
    creado_en = models.DateTimeField(auto_now_add=True)

class Factura(models.Model):
    cuf = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    nit_emisor = models.CharField(max_length=20)
    nit_receptor = models.CharField(max_length=20)
    fecha_emision = models.DateTimeField()
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    codigo_establecimiento = models.CharField(max_length=10)
    codigo_punto_venta = models.CharField(max_length=10)
    forma_pago = models.CharField(max_length=20)
    cuis = models.ForeignKey(Cuis, on_delete=models.PROTECT)
    cufd = models.ForeignKey(Cufd, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, default="Aceptado")

class DetalleFactura(models.Model):
    factura = models.ForeignKey(Factura, related_name='detalles', on_delete=models.CASCADE)
    descripcion = models.TextField()
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=10, decimal_places=2)