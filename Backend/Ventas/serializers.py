# ventas/serializers.py

from rest_framework import serializers
from .models import Estado, TipoVenta, Factura, Pedido, DetallePedido, Cliente, TipoPago, Transaccion
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

class TipoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPago
        fields = '__all__'

class TransaccionSerializer(serializers.ModelSerializer):
    tipo_pago_id = serializers.PrimaryKeyRelatedField(source='tipo_pago', queryset=TipoPago.objects.all(), write_only=True)
    tipo_pago = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Transaccion
        fields = ['id', 'tipo_pago', 'tipo_pago_id', 'monto']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)  
    detalles_input = DetallePedidoSerializer(many=True, write_only=True, required=False)

    transacciones = TransaccionSerializer(many=True, read_only=True)
    transacciones_input = TransaccionSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Pedido
        fields = ['id', 'usuario', 'fecha', 'estado', 'total', 'tipo_venta',
                  'detalles', 'detalles_input', 'transacciones', 'transacciones_input']
        read_only_fields = ['id']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles_input', [])
        transacciones_data = validated_data.pop('transacciones_input', [])
        # Crear el pedido sin el total aún
        pedido = Pedido.objects.create(**validated_data)
        for detalle in detalles_data:
            DetallePedido.objects.create(
                pedido=pedido,
                producto=detalle['producto'],
                cantidad=detalle['cantidad']
            )   
        for transaccion in transacciones_data:
            Transaccion.objects.create(
                pedido=pedido,
                tipo_pago=transaccion['tipo_pago'],
                monto=transaccion['monto']
            )
        pedido.save()

        return pedido


    

class FacturaSerializer(serializers.ModelSerializer):
    #venta = VentaSerializer()
    class Meta:
        model = Factura
        fields = '__all__'
