# payments/middleware.py
import logging
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('payments')

class StripeSecurityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Log todas las requests a endpoints de pago
        if '/api/payments/' in request.path:
            logger.info(f"Payment request: {request.method} {request.path} from {request.META.get('REMOTE_ADDR')}")
        
        # Validar webhooks de Stripe
        if '/api/payments/webhook/' in request.path:
            if request.method != 'POST':
                logger.warning(f"Invalid webhook method: {request.method}")
                return HttpResponse(status=405)
            
            if not request.META.get('HTTP_STRIPE_SIGNATURE'):
                logger.warning("Webhook without Stripe signature")
                return HttpResponse(status=400)
        
        return None
    
    def process_response(self, request, response):
        # Log respuestas de error en pagos
        if '/api/payments/' in request.path and response.status_code >= 400:
            logger.warning(f"Payment error: {response.status_code} for {request.path}")
        
        return response