from rest_framework import serializers
from accounts.models import Usuario,Rol, Privilegio,Bitacora

class UsuarioSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'fecha_expiracion', 'plan',
            'direccion', 'estado', 'nombre_empresa', 'nit_empresa', 'is_staff',
            # ✅ AGREGAR CAMPOS SIAT
            'razon_social', 'codigo_sistema', 'clave_siat', 'codigo_ambiente',
            'municipio', 'telefono_empresa'
        ]
        read_only_fields = ['id', 'is_staff']
        # ✅ HACER QUE LA CLAVE SIAT SEA WRITE-ONLY POR SEGURIDAD
        extra_kwargs = {
            'clave_siat': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['is_staff'] = True  
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # ✅ MANEJAR ACTUALIZACIÓN DE CAMPOS SIAT
        return super().update(instance, validated_data)

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
