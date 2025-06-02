# payments/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny  # Agregar AllowAny
from rest_framework.decorators import api_view, permission_classes  # Agregar estas importaciones
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.utils.decorators import method_decorator
import stripe
import json
import logging
import uuid  # Importar uuid para generar claves de idempotencia

from .services import StripeService 
from .models import Payment, Subscription
from .serializers import (
    PaymentSerializer, 
    SubscriptionSerializer,
    CreatePaymentIntentSerializer,
    CreateSubscriptionSerializer
)
from .permissions import IsAuthenticatedOrRegistration  # Importar el permiso personalizado

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    try:
        # Log de la solicitud recibida
        logger.info(f"PaymentIntent request received: {request.data}")
        
        # Validar datos requeridos
        required_fields = ['amount', 'currency']
        missing_fields = [field for field in required_fields if field not in request.data]
        
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return Response(
                {'error': f'Campos requeridos faltantes: {missing_fields}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount_dollars = request.data.get('amount')
        currency = request.data.get('currency', 'usd')
        description = request.data.get('description', '')
        registration_flow = request.data.get('registration_flow', False)
        
        # Validar y convertir amount de dólares a centavos
        try:
            # Convertir a float para manejar decimales (ej: 10.50)
            amount_dollars = float(amount_dollars)
            
            if amount_dollars <= 0:
                raise ValueError("Amount must be positive")
            
            # Verificar mínimo de $0.50 USD
            if amount_dollars < 0.50:
                return Response(
                    {'error': 'El monto mínimo es $0.50 USD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convertir dólares a centavos (multiplicar por 100)
            amount_cents = int(amount_dollars * 100)
            
            logger.info(f"💰 Amount conversion: ${amount_dollars} USD → {amount_cents} centavos")
            
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid amount: {amount_dollars}, error: {e}")
            return Response(
                {'error': 'Monto inválido. Debe ser un número positivo en dólares (ej: 10.50)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usar el servicio de Stripe (enviar centavos)
        stripe_service = StripeService()
        
        # Crear PaymentIntent con centavos
        payment_intent_data = stripe_service.create_payment_intent(
            amount=amount_cents,  # Enviamos centavos a Stripe
            currency=currency,
            description=description,
            registration_flow=registration_flow,
            user=request.user if request.user.is_authenticated else None
        )
        
        # Agregar información de dólares a la respuesta
        payment_intent_data['amount_dollars'] = amount_dollars
        payment_intent_data['amount_formatted'] = f"${amount_dollars:.2f} {currency.upper()}"
        
        logger.info(f"PaymentIntent created successfully: {payment_intent_data.get('payment_intent_id')}")
        
        return Response(payment_intent_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Error interno del servidor'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            payment_intent_id = request.data.get('payment_intent_id')
            
            if not payment_intent_id:
                return Response(
                    {'error': 'Payment intent ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            stripe_service = StripeService()
            result = stripe_service.confirm_payment(payment_intent_id)
            
            return Response({
                'status': result['status'],
                'payment': PaymentSerializer(result['payment']).data
            })
            
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            price_id = request.data.get('price_id')
            
            if not price_id:
                return Response(
                    {'error': 'Price ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            stripe_service = StripeService()
            result = stripe_service.create_subscription(
                user=request.user,
                price_id=price_id
            )
            
            return Response({
                'subscription_id': result['subscription_id'],
                'client_secret': result['client_secret'],
                'subscription': SubscriptionSerializer(result['subscription']).data
            })
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """Manejar webhooks de Stripe"""
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            logger.error("Invalid payload in webhook")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in webhook")
            return HttpResponse(status=400)
        
        # Manejar diferentes tipos de eventos
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            self._handle_payment_succeeded(payment_intent)
            
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            self._handle_payment_failed(payment_intent)
            
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            self._handle_subscription_payment_succeeded(invoice)
            
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            self._handle_subscription_updated(subscription)
            
        return HttpResponse(status=200)
    
    def _handle_payment_succeeded(self, payment_intent):
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent['id']
            )
            payment.status = 'succeeded'
            payment.save()
            
            logger.info(f"Payment succeeded: {payment_intent['id']}")
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found: {payment_intent['id']}")
    
    def _handle_payment_failed(self, payment_intent):
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent['id']
            )
            payment.status = 'failed'
            payment.save()
            
            logger.info(f"Payment failed: {payment_intent['id']}")
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found: {payment_intent['id']}")
    
    def _handle_subscription_payment_succeeded(self, invoice):
        subscription_id = invoice['subscription']
        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=subscription_id
            )
            subscription.status = 'active'
            subscription.save()
            
            logger.info(f"Subscription payment succeeded: {subscription_id}")
            
        except Subscription.DoesNotExist:
            logger.error(f"Subscription not found: {subscription_id}")
    
    def _handle_subscription_updated(self, stripe_subscription):
        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=stripe_subscription['id']
            )
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = stripe_subscription['current_period_start']
            subscription.current_period_end = stripe_subscription['current_period_end']
            subscription.save()
            
            logger.info(f"Subscription updated: {stripe_subscription['id']}")
            
        except Subscription.DoesNotExist:
            logger.error(f"Subscription not found: {stripe_subscription['id']}")