import stripe
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import StripeCustomer, Payment, Subscription
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class StripeService:
    def __init__(self):
        # Verificar que la clave esté configurada
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY no está configurada")
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"StripeService initialized with key: {stripe.api_key[:20]}...{stripe.api_key[-4:]}")
    
    def create_customer(self, user):
        """Crear un cliente en Stripe"""
        try:
            # Verificar si ya existe
            stripe_customer, created = StripeCustomer.objects.get_or_create(
                user=user,
                defaults={
                    'stripe_customer_id': ''
                }
            )
            
            if created or not stripe_customer.stripe_customer_id:
                # Crear en Stripe
                customer = stripe.Customer.create(
                    email=user.correo,  # Cambiado de user.email a user.correo
                    name=user.nombre,  # Usamos el campo 'nombre' del modelo
                    metadata={
                        'user_id': user.id,
                        'username': user.nombre  # Puedes ajustar esto según lo que necesites
                    }
                )
                
                stripe_customer.stripe_customer_id = customer.id
                stripe_customer.save()
                
                logger.info(f"Customer created for user {user.id}: {customer.id}")
            
            return stripe_customer
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            raise
    
    def create_payment_intent(self, user, amount, currency='usd', description=''):
        """Crear un PaymentIntent"""
        try:
            # Asegurar que el usuario tiene un customer en Stripe
            stripe_customer = self.create_customer(user)
            
            # Convertir a centavos
            amount_cents = int(float(amount) * 100)
            
            # Crear PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                customer=stripe_customer.stripe_customer_id,
                description=description,
                metadata={
                    'user_id': user.id,
                    'user_email': user.correo  # Cambiado de user.email a user.correo
                },
                automatic_payment_methods={
                    'enabled': True,
                }
            )
            
            # Guardar en base de datos
            payment = Payment.objects.create(
                user=user,
                stripe_payment_intent_id=intent.id,
                amount=amount,
                currency=currency,
                description=description,
                status='pending',
                metadata={
                    'stripe_customer_id': stripe_customer.stripe_customer_id
                }
            )
            
            logger.info(f"PaymentIntent created: {intent.id} for user {user.id}")
            
            return {
                'client_secret': intent.client_secret,
                'payment_id': str(payment.id),  # Convertimos UUID a string
                'stripe_payment_intent_id': intent.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating PaymentIntent: {e}")
            raise
    
    def confirm_payment(self, payment_intent_id):
        """Confirmar un pago"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Actualizar en base de datos
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
            payment.status = intent.status
            payment.save()
            
            return {
                'status': intent.status,
                'payment': payment
            }
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found: {payment_intent_id}")
            raise
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {e}")
            raise
    
    def create_subscription(self, user, price_id):
        """Crear una suscripción"""
        try:
            stripe_customer = self.create_customer(user)
            
            subscription = stripe.Subscription.create(
                customer=stripe_customer.stripe_customer_id,
                items=[{
                    'price': price_id,
                }],
                payment_behavior='default_incomplete',
                payment_settings={'save_default_payment_method': 'on_subscription'},
                expand=['latest_invoice.payment_intent']
            )
            
            # Guardar en base de datos
            sub_obj = Subscription.objects.create(
                user=user,
                stripe_subscription_id=subscription.id,
                stripe_price_id=price_id,
                status=subscription.status,
                current_period_start=subscription.current_period_start,
                current_period_end=subscription.current_period_end
            )
            
            return {
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret,
                'subscription': sub_obj
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {e}")
            raise
    
    def cancel_subscription(self, subscription_id):
        """Cancelar una suscripción"""
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            
            # Actualizar en base de datos
            sub_obj = Subscription.objects.get(stripe_subscription_id=subscription_id)
            sub_obj.status = 'canceled'
            sub_obj.save()
            
            return sub_obj
            
        except Subscription.DoesNotExist:
            logger.error(f"Subscription not found: {subscription_id}")
            raise
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {e}")
            raise