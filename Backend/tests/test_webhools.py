# tests/test_webhooks.py
import json
import stripe
from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, Mock

class StripeWebhookTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.webhook_url = reverse('stripe-webhook')
        
    def create_webhook_payload(self, event_type, data):
        """Crear payload de webhook simulado"""
        return {
            'id': 'evt_test_webhook',
            'object': 'event',
            'type': event_type,
            'data': {'object': data},
            'created': 1234567890
        }
    
    @patch('stripe.Webhook.construct_event')
    def test_payment_succeeded_webhook(self, mock_construct_event):
        """Test webhook de pago exitoso"""
        payment_intent_data = {
            'id': 'pi_test_123',
            'amount': 10000,
            'currency': 'usd',
            'status': 'succeeded'
        }
        
        mock_construct_event.return_value = self.create_webhook_payload(
            'payment_intent.succeeded', 
            payment_intent_data
        )
        
        response = self.client.post(
            self.webhook_url,
            data=json.dumps(payment_intent_data),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_signature'
        )
        
        self.assertEqual(response.status_code, 200)
    
    @patch('stripe.Webhook.construct_event')
    def test_invalid_signature_webhook(self, mock_construct_event):
        """Test webhook con firma inválida"""
        mock_construct_event.side_effect = stripe.error.SignatureVerificationError(
            'Invalid signature', 'sig_header'
        )
        
        response = self.client.post(
            self.webhook_url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='invalid_signature'
        )
        
        self.assertEqual(response.status_code, 400)