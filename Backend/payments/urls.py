# payments/urls.py
from django.urls import path
from .views import (
    create_payment_intent,         # Función (no clase)
    ConfirmPaymentView,           # Clase
    CreateSubscriptionView,       # Clase
    StripeWebhookView            # Clase
)

urlpatterns = [
    path('create-payment-intent/', create_payment_intent, name='create_payment_intent'),
    path('confirm-payment/', ConfirmPaymentView.as_view(), name='confirm_payment'),
    path('create-subscription/', CreateSubscriptionView.as_view(), name='create_subscription'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
]

