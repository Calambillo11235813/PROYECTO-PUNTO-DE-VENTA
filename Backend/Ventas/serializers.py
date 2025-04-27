# ventas/serializers.py

from rest_framework import serializers
from .models import Estado, TipoVenta, Venta, Factura, Pedido, DetallePedido
from accounts.models import Usuario, Empresa
from Productos.models import Producto

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'

class TipoVentaSerializer(serializers.ModelSerializer):
    estado = EstadoSerializer()

    class Meta:
        model = TipoVenta
        fields = '__all__'

class VentaSerializer(serializers.ModelSerializer):
    tipo_venta = serializers.PrimaryKeyRelatedField(queryset=TipoVenta.objects.all())

    class Meta:
        model = Venta
        fields = '__all__'

class FacturaSerializer(serializers.ModelSerializer):
    venta = VentaSerializer()

    class Meta:
        model = Factura
        fields = '__all__'

class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = ['producto', 'cantidad']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, write_only=True)  # para crear
    detalle_pedido = DetallePedidoSerializer(many=True, read_only=True, source='detalles')  # para mostrar

    class Meta:
        model = Pedido
        fields = ['id', 'empresa', 'usuario', 'fecha', 'estado', 'observaciones', 'detalles', 'detalle_pedido']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        pedido = Pedido.objects.create(**validated_data)
        for detalle in detalles_data:
            DetallePedido.objects.create(pedido=pedido, empresa=pedido.empresa, **detalle)
        return pedido
