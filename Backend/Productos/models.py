# Create your models here.
from django.db import models
from cloudinary.models import CloudinaryField
from accounts.models import Usuario
from Sucursales.models import Sucursal
# Create your models here.

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='categorias')
    def __str__(self):
        return self.nombre

class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='proveedores')

    def __str__(self):
        return self.nombre
    
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion =models.TextField(blank=True)
    imagen = CloudinaryField('image', null=True, blank=True) 
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE,null=True , blank=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE,null=True , blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='productos') 
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name='productos',
        null=True,  # Para permitir migración gradual
        blank=True
    )
    def __str__(self):
        
        return self.nombre
    
class Inventario(models.Model):
    producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='inventario')
    stock = models.IntegerField(default=0)
    cantidad_minima = models.IntegerField()
    cantidad_maxima = models.IntegerField()

    def __str__(self):
        return f'Inventario de {self.producto.nombre}'

class PedidoProveedor(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('recibido', 'Recibido'),
        ('cancelado', 'Cancelado'),
    ]
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    fecha = models.DateTimeField(auto_now_add=True)
    fecha_entrega_estimada = models.DateField(null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    codigo_control = models.CharField(max_length=100, blank=True, null=True)
    numero_autorizacion = models.CharField(max_length=100, blank=True, null=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    def save(self, *args, **kwargs):
        estado_anterior = None
        if self.pk:
            estado_anterior = PedidoProveedor.objects.get(pk=self.pk).estado
        super().save(*args, **kwargs)
        total = sum(detalle.subtotal for detalle in self.detalles.all())
        if self.total != total:
            self.total = total
            super().save(update_fields=['total'])
        # Si el estado cambió a 'recibido', actualiza el stock
        if estado_anterior != 'recibido' and self.estado == 'recibido':
            for detalle in self.detalles.all():
                producto = detalle.producto
                if producto.sucursal_id == self.sucursal_id:
                    inventario = getattr(producto, 'inventario', None)
                    if inventario:
                        inventario.stock += detalle.cantidad
                        inventario.save()
                    else:
                        from Productos.models import Inventario
                        Inventario.objects.create(producto=producto, stock=detalle.cantidad)
                    producto.precio_compra = detalle.precio_compra
                    producto.save()

    def __str__(self):
        return f"Pedido a {self.proveedor.nombre} para {self.sucursal.nombre} ({self.fecha.date()})"

class DetallePedidoProveedor(models.Model):
    pedido = models.ForeignKey(PedidoProveedor, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_compra
        super().save(*args, **kwargs)
        # Actualiza el stock y el precio de compra del producto si el pedido está recibido
        if self.pedido.estado == 'recibido' and self.producto.sucursal_id == self.pedido.sucursal_id:
            inventario = getattr(self.producto, 'inventario', None)
            if inventario:
                inventario.stock += self.cantidad
                inventario.save()
            else:
                from Productos.models import Inventario
                Inventario.objects.create(producto=self.producto, stock=self.cantidad)
            self.producto.precio_compra = self.precio_compra
            self.producto.save()

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} (Pedido #{self.pedido.id})"
