# payments/validators.py
from rest_framework import serializers
import re

class PaymentDataValidator:
    @staticmethod
    def validate_amount(amount):
        """Validar monto de pago"""
        if not isinstance(amount, (int, float)):
            raise serializers.ValidationError("Amount must be a number")
        
        if amount <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        
        if amount > 999999:
            raise serializers.ValidationError("Amount exceeds maximum limit")
        
        return amount
    
    @staticmethod
    def validate_currency(currency):
        """Validar código de moneda"""
        valid_currencies = ['usd', 'eur', 'gbp', 'cad', 'aud']
        
        if currency.lower() not in valid_currencies:
            raise serializers.ValidationError("Invalid currency code")
        
        return currency.lower()
    
    @staticmethod
    def validate_metadata(metadata):
        """Validar metadatos"""
        if not isinstance(metadata, dict):
            raise serializers.ValidationError("Metadata must be a dictionary")
        
        # Limitar tamaño de metadatos
        if len(str(metadata)) > 500:
            raise serializers.ValidationError("Metadata too large")
        
        return metadata

# Aplicar en serializers
class PaymentIntentSerializer(serializers.Serializer):
    amount = serializers.FloatField(validators=[PaymentDataValidator.validate_amount])
    currency = serializers.CharField(validators=[PaymentDataValidator.validate_currency])
    description = serializers.CharField(max_length=200, required=False)
    metadata = serializers.DictField(validators=[PaymentDataValidator.validate_metadata], required=False)