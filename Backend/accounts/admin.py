from django.contrib import admin
from .models import Usuario, Rol, Permisos, Empleado

class RolAdmin(admin.ModelAdmin):
    """
    Personalización de la administración de roles para que
    no asigne permisos automáticamente al crear un nuevo rol.
    """
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None:  # Cuando estamos creando un nuevo rol
            # Evitar que el campo permisos tenga valores preseleccionados
            if 'permisos' in form.base_fields:
                form.base_fields['permisos'].initial = []
        return form
    
    def save_related(self, request, form, formsets, change):
        """
        Sobrescribir este método para controlar cómo se guardan las relaciones.
        Si estamos creando un nuevo rol (change=False), no asignaremos ningún permiso.
        """
        super().save_related(request, form, formsets, change)
        if not change:  # Si estamos creando un nuevo objeto
            # Limpiar todos los permisos que se hayan asignado automáticamente
            form.instance.permisos.clear()

# Registrar los modelos
admin.site.register(Usuario)
admin.site.register(Rol, RolAdmin)  # Usar la clase personalizada RolAdmin
admin.site.register(Permisos)
admin.site.register(Empleado)