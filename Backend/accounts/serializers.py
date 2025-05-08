from rest_framework import serializers
from accounts.models import Usuario,Rol, Privilegio,Bitacora,Empleado

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
    class Meta:
        model = Rol
        fields = ['id', 'nombre_rol']

class PrivilegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Privilegio
        fields = ['id', 'descripcion']

class BitacoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bitacora
        fields = ['id', 'ip', 'fecha', 'hora', 'accion', 'usuario']

class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = ['id', 'usuario', 'nombre', 'correo', 'password', 'direccion', 'estado', 'fecha_contratacion', 'rol']
        extra_kwargs = {
            'rol': {'required': False},
            'password': {'write_only': True}  # evita que se muestre en el GET
        }
