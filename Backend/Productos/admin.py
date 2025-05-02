from django.contrib import admin
from .models import Producto, Categoria, Proveedor, Inventario

# Registramos los modelos
admin.site.register(Producto)
admin.site.register(Categoria)
admin.site.register(Proveedor)
admin.site.register(Inventario)
