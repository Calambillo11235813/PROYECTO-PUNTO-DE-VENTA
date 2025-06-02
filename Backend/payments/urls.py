# payments/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('create-payment-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm-payment/', views.ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('create-subscription/', views.CreateSubscriptionView.as_view(), name='create-subscription'),
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]

