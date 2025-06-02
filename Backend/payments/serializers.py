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

class CreatePaymentIntentSerializer(serializers.Serializer):
    """
    Serializer para validar los datos de entrada al crear un PaymentIntent.
    """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.50) # Ejemplo: mínimo 0.50 USD
    currency = serializers.CharField(max_length=3, default='usd')
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    # Podrías añadir más campos si los necesitas, como 'payment_method_types'

class CreateSubscriptionSerializer(serializers.Serializer):
    """
    Serializer para validar los datos de entrada al crear una Suscripción.
    """
    price_id = serializers.CharField(max_length=255) # El ID del Price de Stripe
    # Podrías añadir 'payment_method_id' si el cliente ya tiene uno guardado y quieres usarlo.