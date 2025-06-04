from rest_framework import serializers
from accounts.models import Usuario,Rol, Bitacora,Empleado,Permisos
from .models import Plan, Suscripcion, HistorialSuscripcion

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'fecha_expiracion', 'plan',
            'direccion', 'estado', 'nombre_empresa', 'nit_empresa', 'is_staff'
        ]
        read_only_fields = ['id', 'is_staff']

    def create(self, validated_data):
        validated_data['is_staff'] = True  
        return super().create(validated_data)

class RolSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    
    class Meta:
        model = Rol
        fields = ['id', 'nombre_rol', 'usuario', 'usuario_nombre', 'permisos']
        extra_kwargs = {
            'permisos': {'required': False}
        }

class PermisosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permisos
        fields = ['id', 'nombre', 'descripcion']

class BitacoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bitacora
        fields = ['id', 'ip', 'fecha', 'hora', 'accion', 'usuario']

class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = ['id', 'usuario', 'nombre', 'correo', 'password','telefono', 'direccion', 'estado', 'fecha_contratacion', 'rol']
        extra_kwargs = {
            'rol': {'required': False},
            'password': {'write_only': True}  # evita que se muestre en el GET
        }

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'
        

class SuscripcionSerializer(serializers.ModelSerializer):
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    plan_descripcion = serializers.CharField(source='plan.descripcion', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    esta_activa = serializers.ReadOnlyField()
    
    class Meta:
        model = Suscripcion
        fields = '__all__'


class HistorialSuscripcionSerializer(serializers.ModelSerializer):
    plan_anterior_nombre = serializers.CharField(source='plan_anterior.nombre', read_only=True)
    plan_nuevo_nombre = serializers.CharField(source='plan_nuevo.nombre', read_only=True)
    
    class Meta:
        model = HistorialSuscripcion
        fields = '__all__'


class SuscripcionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suscripcion
        fields = ['usuario', 'plan', 'fecha_inicio', 'fecha_expiracion', 'metodo_pago', 'monto_pagado', 'referencia_pago']
        
    def create(self, validated_data):
        suscripcion = Suscripcion.objects.create(**validated_data)
        return suscripcion
