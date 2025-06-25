from rest_framework import serializers
from .models import *

class DetalleFacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleFactura
        exclude = ['factura']

class FacturaSerializer(serializers.ModelSerializer):
    detalles = DetalleFacturaSerializer(many=True)

    class Meta:
        model = Factura
        fields = '__all__'

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        factura = Factura.objects.create(**validated_data)
        for detalle in detalles_data:
            DetalleFactura.objects.create(factura=factura, **detalle)
        return factura
