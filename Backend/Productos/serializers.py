from rest_framework import serializers
from .models import Producto, Categoria, Proveedor, Inventario
from accounts.serializers import UsuarioSerializer
from accounts.models import Usuario
from Productos.models import Producto
from cloudinary.utils import cloudinary_url

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__' 

class ProductoSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(source='inventario.stock', read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    
    proveedor = ProveedorSerializer(read_only=True)
    usuario = UsuarioSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), source='categoria', write_only=True,required=False,allow_null=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all(), source='proveedor', write_only=True,required=False,allow_null=True)
    imagen_url = serializers.SerializerMethodField()
    usuario_id = serializers.PrimaryKeyRelatedField( queryset=Usuario.objects.all(), source='usuario', write_only=True)

    # Campos nuevos para el inventario inicial
    stock_inicial = serializers.IntegerField(write_only=True, required=False)
    cantidad_minima = serializers.IntegerField(write_only=True, required=False)
    cantidad_maxima = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'precio_compra', 'precio_venta', 'descripcion', 'imagen', 'imagen_url',
            'categoria', 'proveedor', 'categoria_id', 'proveedor_id','usuario_id','usuario', 'stock',
            'stock_inicial', 'cantidad_minima', 'cantidad_maxima'
        ]

    def get_imagen_url(self, obj):
        if obj.imagen:
            try:
                return obj.imagen.url
            except Exception as e:
                print(f"Error al obtener URL de imagen: {e}")
                return None
        return None

    def validate_precio_venta(self, valor):
        if valor <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a cero.")
        return valor

    def create(self, validated_data):
        stock_inicial = validated_data.pop('stock_inicial', 0)
        cantidad_minima = validated_data.pop('cantidad_minima', 0)
        cantidad_maxima = validated_data.pop('cantidad_maxima', 0)

        producto = Producto.objects.create(**validated_data)

        Inventario.objects.create(
            producto=producto,
            stock=stock_inicial,
            cantidad_minima=cantidad_minima,
            cantidad_maxima=cantidad_maxima
        )

        return producto

    

class InventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventario
        fields = '__all__'

    def validate_stock(self, valor):
        if valor < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return valor