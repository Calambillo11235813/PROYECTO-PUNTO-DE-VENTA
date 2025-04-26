from django.contrib import admin
from .models import Empresa, Usuario, Rol
# Register your models here.
admin.site.register(Empresa)
admin.site.register(Usuario)
admin.site.register(Rol)
