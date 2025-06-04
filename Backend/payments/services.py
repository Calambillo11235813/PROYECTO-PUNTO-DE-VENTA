import stripe
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            logger.info("Stripe initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing Stripe: {e}")
            raise
    
    def create_payment_intent(self, amount, currency='usd', description='', registration_flow=False, user=None):
        try:
            logger.info(f"Creating PaymentIntent: amount={amount}, currency={currency}, registration_flow={registration_flow}")
            
            # Verificar configuración de Stripe
            if not settings.STRIPE_SECRET_KEY:
                raise ValueError("STRIPE_SECRET_KEY not configured")
            
            if not settings.STRIPE_PUBLISHABLE_KEY:
                raise ValueError("STRIPE_PUBLISHABLE_KEY not configured")
            
            # Crear metadata
            metadata = {
                'registration_flow': str(registration_flow),
                'description': description
            }
            
            if user and user.is_authenticated:
                metadata['user_id'] = str(user.id)
                metadata['user_email'] = user.correo
            
            # Crear PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                description=description,
                metadata=metadata,
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            
            logger.info(f"PaymentIntent created successfully: {payment_intent.id}")
            
            return {
                'client_secret': payment_intent.client_secret,
                'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
                'payment_intent_id': payment_intent.id,
                'payment_intent_status': payment_intent.status
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(f"Error de Stripe: {e.user_message}")
        except Exception as e:
            logger.error(f"Unexpected error creating PaymentIntent: {e}", exc_info=True)
            raise