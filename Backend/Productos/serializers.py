from rest_framework import serializers
from .models import Producto, Categoria, Proveedor, Inventario
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
    categoria_id = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), source='categoria', write_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all(), source='proveedor', write_only=True)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'precio_compra', 'precio_venta', 'descripcion', 'imagen_url',
                  'categoria', 'proveedor', 'categoria_id', 'proveedor_id', 'stock']

    def get_imagen_url(self, obj):
       if obj.imagen:
        return obj.imagen.url
       return None


    def validate_precio_venta(self, valor):
        if valor <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a cero.")
        return valor

    

class InventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventario
        fields = '__all__'

    def validate_stock(self, valor):
        if valor < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return valor