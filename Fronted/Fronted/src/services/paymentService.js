// src/services/paymentService.js
import api from './apiClient'; // Tu cliente API configurado

class PaymentService {
  async createPaymentIntent(amount, currency = 'usd', description = '') {
    try {
      const response = await api.post('/api/payments/create-payment-intent/', {
        amount,
        currency,
        description
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  async confirmPayment(paymentIntentId) {
    try {
      const response = await api.post('/api/payments/confirm-payment/', {
        payment_intent_id: paymentIntentId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
  
  async createSubscription(priceId) {
    try {
      const response = await api.post('/api/payments/create-subscription/', {
        price_id: priceId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
}

export default new PaymentService();