from django.db import models
from accounts.models import Usuario, Empleado
from Productos.models import Producto

class Estado(models.Model):
    descripcion = models.CharField(max_length=50)
    def __str__(self):
        return self.descripcion
    
class Cliente(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return "self.nombre ({self.cedula_identidad})"

# TipoVenta
class TipoVenta(models.Model):
    descripcion = models.CharField(max_length=50)
   # estado = models.ForeignKey(Estado, on_delete=models.CASCADE)
    def __str__(self):
        return self.descripcion

class Caja(models.Model):
    ESTADOS = (
        ('abierta', 'Abierta'),
        ('cerrada', 'Cerrada'),
    )

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    empleado = models.ForeignKey(Empleado, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    monto_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    monto_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_movimiento_efectivo = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    total_efectivo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_tarjeta = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    estado = models.CharField(max_length=10, choices=ESTADOS, default='abierta')

    def __str__(self):
        return f"Caja de {self.usuario} - {self.estado.upper()}"
    
class MovimientoEfectivo(models.Model):
    TIPO_CHOICES = (
        ('ingreso', 'Ingreso'),
        ('retiro', 'Retiro'),
    )

    caja = models.ForeignKey(Caja, on_delete=models.CASCADE, related_name='movimientos_efectivo')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.tipo.upper()} de Bs. {self.monto} en {self.caja}"


class Pedido(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE,null=True, blank=True)  
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_venta = models.ForeignKey(TipoVenta, on_delete=models.CASCADE,null=True, blank=True)
    def __str__(self):
        return f"Pedido #{self.id} - Usuario {self.usuario.correo}"

# DetallePedido (antes OrdenItem)
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad}"

class TipoPago(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class Transaccion(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='transacciones')
    tipo_pago = models.ForeignKey(TipoPago, on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.tipo_pago.nombre}: {self.monto} Bs."




# Factura de una Venta
class Factura(models.Model):
    #venta = models.OneToOneField(Venta, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    nit = models.CharField(max_length=20)
    precio_unidad = models.DecimalField(max_digits=10, decimal_places=2)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    codigo_autorizacion = models.CharField(max_length=100)
    estado = models.CharField(max_length=20)

    def __str__(self):
        return f"Factura #{self.id} - Venta #{self.venta.id}"

