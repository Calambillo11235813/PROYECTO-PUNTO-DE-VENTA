from django.contrib import admin
from .models import Pedido, Estado, TipoVenta,DetallePedido
# Register your models here.
admin.site.register(Pedido),
admin.site.register(Estado),
admin.site.register(TipoVenta),
admin.site.register(DetallePedido)
