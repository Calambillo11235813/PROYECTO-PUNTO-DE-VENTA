from rest_framework import serializers
from accounts.models import Usuario,Rol, Privilegio,Bitacora

class UsuarioSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
         queryset=Rol.objects.all(), source='rol', write_only=True
     )
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo','fecha_expiracion', 'plan',
            'direccion', 'estado', 'nombre_empresa', 'nit_empresa', 'is_staff','role_id'
        ]
        read_only_fields = ['id', 'is_staff']

    def create(self, validated_data):
        validated_data['is_staff'] = True  
        return super().create(validated_data)

# serializers.py

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
