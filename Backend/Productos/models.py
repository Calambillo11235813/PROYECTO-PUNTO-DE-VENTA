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
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='pedidos_proveedor')
    cantidad = models.PositiveIntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pedidos_proveedor')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualiza el stock solo si el producto pertenece a la sucursal
        if self.producto.sucursal_id == self.sucursal_id:
            inventario = getattr(self.producto, 'inventario', None)
            if inventario:
                inventario.stock += self.cantidad
                inventario.save()
            else:
                # Si no existe inventario, puedes crearlo o lanzar un error controlado
                from Productos.models import Inventario
                Inventario.objects.create(producto=self.producto, stock=self.cantidad)

    def __str__(self):
        return f"Pedido a {self.proveedor.nombre} de {self.cantidad} {self.producto.nombre} para {self.sucursal.nombre}"
