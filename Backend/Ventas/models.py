from django.db import models
from accounts.models import Usuario
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

class Pedido(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE)  
    total = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_venta = models.ForeignKey(TipoVenta, on_delete=models.CASCADE)
    def __str__(self):
        return f"Pedido #{self.id} - Usuario {self.usuario.correo}"

# DetallePedido (antes OrdenItem)
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad}"

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

