from rest_framework import serializers
from .models import Payment, Subscription, StripeCustomer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer básico para el modelo User.
    Usado para representar al usuario en otros serializers.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class StripeCustomerSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo StripeCustomer.
    """
    user = UserSerializer(read_only=True) # Muestra detalles del usuario, no permite modificarlo desde aquí

    class Meta:
        model = StripeCustomer
        fields = ['id', 'user', 'stripe_customer_id', 'created_at']
        read_only_fields = ['stripe_customer_id', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Payment.
    """
    user = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amount_dollars = serializers.SerializerMethodField()
    amount_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 
            'user', 
            'stripe_payment_intent_id', 
            'amount', 
            'currency', 
            'status',
            'status_display', # Campo para mostrar el valor legible del estado
            'description', 
            'metadata', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = [
            'id', 
            'user', 
            'stripe_payment_intent_id', 
            'status', 
            'status_display',
            'created_at', 
            'updated_at'
        ]

    def get_amount_dollars(self, obj):
        """Convertir centavos a dólares"""
        return obj.amount / 100
    
    def get_amount_formatted(self, obj):
        """Formato amigable del monto"""
        return f"${obj.amount / 100:.2f} {obj.currency.upper()}"

class CreatePaymentIntentSerializer(serializers.Serializer):
    """
    Serializer para validar los datos de entrada al crear un PaymentIntent.
    """
    amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=0.50,
        help_text="Monto en dólares (ej: 10.50 para $10.50 USD)"
    )
    currency = serializers.CharField(
        max_length=3, 
        default='usd',
        help_text="Código de moneda (usd, eur, etc.)"
    )
    description = serializers.CharField(
        max_length=255, 
        required=False,
        help_text="Descripción del pago"
    )
    registration_flow = serializers.BooleanField(
        default=False,
        help_text="Indica si es parte del flujo de registro"
    )

class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Subscription.
    """
    user = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 
            'user', 
            'stripe_subscription_id', 
            'stripe_price_id', 
            'status',
            'status_display', # Campo para mostrar el valor legible del estado
            'current_period_start', 
            'current_period_end', 
            'created_at'
        ]
        read_only_fields = [
            'id', 
            'user', 
            'stripe_subscription_id', 
            'status',
            'status_display',
            'current_period_start', 
            'current_period_end', 
            'created_at'
        ]

class CreateSubscriptionSerializer(serializers.Serializer):
    """
    Serializer para validar los datos de entrada al crear una Suscripción.
    """
    price_id = serializers.CharField(
        max_length=255,
        help_text="ID del precio de Stripe"
    )