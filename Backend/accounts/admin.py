from django.contrib import admin
from .models import Empresa, Usuario, Rol,Privilegio, Permisos
# Register your models here.
admin.site.register(Empresa)
admin.site.register(Usuario)
admin.site.register(Rol)
admin.site.register(Privilegio)