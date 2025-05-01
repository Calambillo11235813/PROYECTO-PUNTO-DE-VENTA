# ventas/serializers.py

from rest_framework import serializers
from .models import Estado, TipoVenta, Factura, Pedido, DetallePedido, Cliente
from accounts.models import Usuario, Empresa
from Productos.models import Producto

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'nit', 'cedula_identidad']

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
    detalles = DetallePedidoSerializer(many=True, write_only=True, required=False)
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), source='cliente', write_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'usuario','cliente', 'cliente_id', 'fecha', 'estado', 'total', 'tipo_venta', 'detalles']
        read_only_fields = ['id', 'total']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        empresa = validated_data.pop('empresa')  # Obtener la empresa del controlador
        
        # Crear el pedido sin el total aún
        pedido = Pedido.objects.create(empresa=empresa, total=0, **validated_data)
        
        total = 0
        for detalle in detalles_data:
            subtotal = detalle['producto'].precio_venta * detalle['cantidad']
            DetallePedido.objects.create(
                pedido=pedido,
                producto=detalle['producto'],
                cantidad=detalle['cantidad'],
                empresa=empresa
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
