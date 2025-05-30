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
    password = models.CharField(max_length=128)  
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_contratacion = models.DateField(null=True, blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return self.nombre


class Plan(models.Model):
    PLAN_TYPES = [
        ('basico', 'Básico'),
        ('intermedio', 'Intermedio'),
        ('avanzado', 'Avanzado'),
    ]
    
    DURATION_TYPES = [
        ('anual', 'Anual'),
    ]
    
    nombre = models.CharField(max_length=50, choices=PLAN_TYPES, unique=True)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    duracion = models.CharField(max_length=20, choices=DURATION_TYPES, default='anual')
    
    # Límites del plan
    max_productos = models.IntegerField(default=0)  # 0 = ilimitado
    max_empleados = models.IntegerField(default=1)
    max_ventas_mensuales = models.IntegerField(default=0)  # 0 = ilimitado
    max_sucursales = models.IntegerField(default=1)
    max_clientes = models.IntegerField(default=0)  # 0 = ilimitado
    
    # Funcionalidades incluidas
    tiene_inventario_avanzado = models.BooleanField(default=False)
    tiene_reportes_detallados = models.BooleanField(default=False)
    tiene_multi_sucursal = models.BooleanField(default=False)
    tiene_backup_automatico = models.BooleanField(default=False)
    tiene_api_acceso = models.BooleanField(default=False)
    tiene_soporte_prioritario = models.BooleanField(default=False)
    tiene_integraciones = models.BooleanField(default=False)
    tiene_facturacion_electronica = models.BooleanField(default=False)
    
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'plans'
        
    def __str__(self):
        return f"Plan {self.get_nombre_display()}"


class Suscripcion(models.Model):
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
        ('pendiente', 'Pendiente de Pago'),
        ('suspendida', 'Suspendida'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('tarjeta', 'Tarjeta de Crédito'),
        ('transferencia', 'Transferencia Bancaria'),
        ('efectivo', 'Efectivo'),
        ('otro', 'Otro'),
    ]
    
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='suscripcion')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    
    fecha_inicio = models.DateTimeField()
    fecha_expiracion = models.DateTimeField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, null=True, blank=True)
    
    # Información de pago
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    referencia_pago = models.CharField(max_length=100, null=True, blank=True)
    
    # Contadores de uso
    productos_utilizados = models.IntegerField(default=0)
    empleados_utilizados = models.IntegerField(default=0)
    ventas_mes_actual = models.IntegerField(default=0)
    sucursales_utilizadas = models.IntegerField(default=1)
    clientes_utilizados = models.IntegerField(default=0)
    
    # Fechas de control
    ultimo_reset_ventas = models.DateField(auto_now_add=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
        
    def __str__(self):
        return f"Suscripción de {self.usuario.nombre} - Plan {self.plan.nombre}"
    
    @property
    def esta_activa(self):
        from django.utils import timezone
        return (self.estado == 'activa' and 
                self.fecha_expiracion > timezone.now())
    
    def verificar_limite_productos(self):
        if self.plan.max_productos == 0:  # Ilimitado
            return True
        return self.productos_utilizados < self.plan.max_productos
    
    def verificar_limite_empleados(self):
        return self.empleados_utilizados < self.plan.max_empleados
    
    def verificar_limite_ventas_mensuales(self):
        if self.plan.max_ventas_mensuales == 0:  # Ilimitado
            return True
        return self.ventas_mes_actual < self.plan.max_ventas_mensuales
    
    def verificar_limite_sucursales(self):
        return self.sucursales_utilizadas < self.plan.max_sucursales
    
    def verificar_limite_clientes(self):
        if self.plan.max_clientes == 0:  # Ilimitado
            return True
        return self.clientes_utilizados < self.plan.max_clientes
    
    def incrementar_uso_productos(self):
        self.productos_utilizados += 1
        self.save()
    
    def decrementar_uso_productos(self):
        if self.productos_utilizados > 0:
            self.productos_utilizados -= 1
            self.save()
    
    def incrementar_uso_empleados(self):
        self.empleados_utilizados += 1
        self.save()
    
    def decrementar_uso_empleados(self):
        if self.empleados_utilizados > 0:
            self.empleados_utilizados -= 1
            self.save()
    
    def incrementar_ventas_mes(self):
        from django.utils import timezone
        today = timezone.now().date()
        
        # Reset contador si es un nuevo mes
        if self.ultimo_reset_ventas.month != today.month or self.ultimo_reset_ventas.year != today.year:
            self.ventas_mes_actual = 0
            self.ultimo_reset_ventas = today
        
        self.ventas_mes_actual += 1
        self.save()
    
    def incrementar_uso_clientes(self):
        self.clientes_utilizados += 1
        self.save()
    
    def decrementar_uso_clientes(self):
        if self.clientes_utilizados > 0:
            self.clientes_utilizados -= 1
            self.save()


class HistorialSuscripcion(models.Model):
    suscripcion = models.ForeignKey(Suscripcion, on_delete=models.CASCADE, related_name='historial')
    plan_anterior = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='historiales_anteriores')
    plan_nuevo = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='historiales_nuevos')
    
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    motivo = models.CharField(max_length=255, null=True, blank=True)
    realizado_por = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'subscription_history'
        ordering = ['-fecha_cambio']
        
    def __str__(self):
        return f"Cambio de {self.plan_anterior.nombre} a {self.plan_nuevo.nombre}"
