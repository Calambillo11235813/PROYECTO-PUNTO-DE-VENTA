from django.contrib import admin
from .models import Venta,Pedido, Estado, TipoVenta
# Register your models here.
admin.site.register(Venta)
admin.site.register(Pedido),
admin.site.register(Estado),
admin.site.register(TipoVenta)
