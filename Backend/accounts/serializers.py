from rest_framework import serializers
from accounts.models import Usuario, Empresa,Rol, Privilegio,Bitacora


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'nit', 'estado']


class UsuarioSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer(read_only=True)
    empresa_id = serializers.PrimaryKeyRelatedField(
        queryset=Empresa.objects.all(), source='empresa', write_only=True
    )

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'fecha_de_nacimiento', 'genero',
            'direccion', 'estado', 'empresa', 'empresa_id', 'is_staff'
        ]
        read_only_fields = ['id', 'is_staff']

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
