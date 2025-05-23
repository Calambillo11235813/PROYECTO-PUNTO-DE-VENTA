# ventas/serializers.py

from rest_framework import serializers
from .models import Estado, TipoVenta, Factura, Pedido, DetallePedido, Cliente
from accounts.models import Usuario
from Productos.models import Producto

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nombre']

class TipoVentaSerializer(serializers.ModelSerializer):
    estado = EstadoSerializer()

    class Meta:
        model = TipoVenta
        fields = '__all__'

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_id = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all(), source='producto', write_only=True)
    producto = serializers.StringRelatedField(read_only=True)  # Mostrar nombre del producto al listar

    class Meta:
        model = DetallePedido
        fields = ['id', 'producto', 'producto_id', 'cantidad']
        read_only_fields = ['id']


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)  
    detalles_input = DetallePedidoSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Pedido
        fields = ['id', 'usuario', 'fecha', 'estado', 'total', 'tipo_venta', 'detalles','detalles_input']
        read_only_fields = ['id', 'total']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])

        # Crear el pedido sin el total aún
        pedido = Pedido.objects.create(total=0, **validated_data)

        total = 0
        for detalle in detalles_data:
            subtotal = detalle['producto'].precio_venta * detalle['cantidad']
            DetallePedido.objects.create(
                pedido=pedido,
                producto=detalle['producto'],
                cantidad=detalle['cantidad']
            )
            total += subtotal

        # Actualizar el total del pedido
        pedido.total = total
        pedido.save()

        return pedido

    
class FacturaSerializer(serializers.ModelSerializer):
    #venta = VentaSerializer()
    class Meta:
        model = Factura
        fields = '__all__'
