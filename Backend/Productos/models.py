
# Create your models here.
from django.db import models
from cloudinary.models import CloudinaryField
from accounts.models import Empresa
# Create your models here.

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre

class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre
    
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion =models.TextField(blank=True)
    imagen = CloudinaryField('image', null=True, blank=True) 
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)
 

    def __str__(self):
        
        return self.nombre
    
class Inventario(models.Model):
    producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='inventario')
    stock = models.IntegerField(default=0)
    cantidad_minima = models.IntegerField()
    cantidad_maxima = models.IntegerField()

    def __str__(self):
        
        return f'Inventario de {self.producto.nombre}'
    
