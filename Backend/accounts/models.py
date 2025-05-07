# models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class Rol(models.Model):
    nombre_rol = models.CharField(max_length=100)
    def __str__(self):   
        return self.nombre_rol


class Privilegio(models.Model):
    descripcion = models.CharField(max_length=100)

    def __str__(self):
        return self.descripcion


class Permisos(models.Model):
    estado = models.BooleanField(default=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name="permisos")
    privilegio = models.ForeignKey(Privilegio, on_delete=models.CASCADE, related_name="permisos")

    def __str__(self):
        return f"{self.rol} - {self.privilegio}"
class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""

    def create_user(self, correo, nombre, contraseña=None, **extra_fields):
        """Crear un usuario normal"""
        if not correo:
            raise ValueError("El correo es obligatorio")
        correo = self.normalize_email(correo)
        usuario = self.model(correo=correo, nombre=nombre, **extra_fields)
        usuario.set_password(contraseña)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, correo, nombre, contraseña=None, **extra_fields):
        """Crear un superusuario"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(correo, nombre, contraseña, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """Modelo de usuario personalizado"""
    nombre_empresa=models.CharField(max_length=100, blank=True, null=True)
    nit_empresa = models.CharField(max_length=20, blank=True, null=True,unique=True)
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    direccion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_expiracion = models.DateField(blank=True, null=True)
    plan = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)
    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre']
   

    objects = UsuarioManager()

    def __str__(self):
        return self.correo


class Bitacora(models.Model):
    ip = models.GenericIPAddressField()
    fecha = models.DateField(auto_now_add=True)
    hora = models.TimeField(auto_now_add=True)
    accion = models.CharField(max_length=255)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='bitacoras')

    def __str__(self):
        return f"{self.usuario.correo} - {self.accion}"
    
class Empleado(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='empleados')  # Dueño/administrador
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    direccion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.nombre
