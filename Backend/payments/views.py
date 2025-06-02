# payments/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.utils.decorators import method_decorator
import stripe
import json
import logging

from .services import StripeService 
from .models import Payment, Subscription
from .serializers import (
    PaymentSerializer, 
    SubscriptionSerializer,
    CreatePaymentIntentSerializer,  # ← IMPORTACIÓN FALTANTE
    CreateSubscriptionSerializer    # ← PARA CONSISTENCIA
)

logger = logging.getLogger(__name__)

class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Debug: Verificar configuración
            logger.info(f"Stripe key configured: {settings.STRIPE_SECRET_KEY[:20] if settings.STRIPE_SECRET_KEY else 'NOT SET'}...")
            
            serializer = CreatePaymentIntentSerializer(data=request.data)
            if serializer.is_valid():
                # Verificar que el usuario tenga el campo 'correo'
                if not hasattr(request.user, 'correo'):
                    return Response(
                        {'error': 'El usuario no tiene un campo de correo configurado'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                stripe_service = StripeService()
                result = stripe_service.create_payment_intent(
                    user=request.user,
                    amount=serializer.validated_data['amount'],
                    currency=serializer.validated_data.get('currency', 'usd'),
                    description=serializer.validated_data.get('description', '')
                )
                
                return Response({
                    'client_secret': result['client_secret'],
                    'payment_id': result['payment_id'],
                    'publishable_key': settings.STRIPE_PUBLISHABLE_KEY
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error creating payment intent: {str(e)}")
            return Response(
                {'error': str(e)}, 
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