// src/services/paymentService.js
import axios from 'axios';
import api from './apiClient'; // Cliente API con interceptor para autenticación

// Cliente API sin interceptores de autenticación para el registro
const publicApiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Asegúrate de que coincida con la URL base de api
  headers: {
    'Content-Type': 'application/json'
  }
});

class PaymentService {
  async createPaymentIntent(amount, currency = 'usd', description = '', isRegistration = false) {
    try {
      // Validaciones de entrada
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Monto inválido para el pago');
      }
      
      const client = isRegistration ? publicApiClient : api;
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      const requestData = {
        amount: amountInCents,
        currency,
        description,
        registration_flow: isRegistration
      };
      
      console.log('📤 Enviando solicitud de PaymentIntent:', {
        endpoint: '/payments/create-payment-intent/',
        data: requestData,
        isRegistration,
        client: isRegistration ? 'publicApiClient' : 'authenticatedApi'
      });
      
      const response = await client.post('/payments/create-payment-intent/', requestData);
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        data: response.data
      });
      
      // Verificar que la respuesta tenga client_secret
      if (!response.data || !response.data.client_secret) {
        console.error('❌ Respuesta inválida del servidor:', response.data);
        throw new Error('No se recibió client_secret del servidor');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error detallado en createPaymentIntent:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      });
      
      // Re-lanzar con información más específica
      if (error.response?.status === 500) {
        throw new Error('Error interno del servidor al procesar el pago');
      } else if (error.response?.status === 400) {
        throw new Error(`Datos inválidos: ${error.response.data?.detail || error.response.data?.message || 'Verifique los datos enviados'}`);
      } else if (error.response?.status === 403) {
        throw new Error('No autorizado para realizar esta operación');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint de pagos no encontrado');
      }
      
      throw error;
    }
  }
  
  async confirmPayment(paymentIntentId) {
    try {
      const response = await api.post('/payments/confirm-payment/', {
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
      const response = await api.post('/payments/create-subscription/', {
        price_id: priceId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  async createMockPaymentIntent(amount, currency = 'usd', description = '') {
    // Simulación para desarrollo/pruebas
    console.log('🧪 Usando modo simulado de PaymentIntent');
    
    // Simular un pequeño retraso
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Formato correcto para Stripe: pi_XXXXXXXX_secret_YYYYYYYY
    // Eliminar partes adicionales que causan el error
    const randomId = Math.random().toString(36).substring(2, 10);
    const randomSecret = Math.random().toString(36).substring(2, 15);
    const mockId = `pi_${randomId}`;
    const mockSecret = `${mockId}_secret_${randomSecret}`;
    
    return {
      client_secret: mockSecret,
      publishable_key: 'pk_test_mock',
      payment_intent_status: 'requires_payment_method'
    };
  }

  /**
   * Registrar el pago exitoso en el backend
   * @param {Object} paymentData - Datos del pago a registrar
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async recordPayment(paymentData) {
    try {
      const { paymentIntentId, amount, currency, description } = paymentData;
      
      // Validaciones
      if (!paymentIntentId) {
        throw new Error('PaymentIntent ID es requerido');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Monto inválido para registrar el pago');
      }

      console.log('📋 Registrando pago exitoso:', {
        paymentIntentId,
        amount,
        currency,
        description
      });

      const requestData = {
        payment_intent_id: paymentIntentId,
        amount_paid: amount,
        currency: currency || 'usd',
        description: description || '',
        status: 'completed',
        payment_method: 'card',
        timestamp: new Date().toISOString()
      };

      // Usar cliente autenticado para registrar el pago
      const response = await api.post('/payments/record-payment/', requestData);
      
      console.log('✅ Pago registrado exitosamente:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error al registrar el pago:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // No lanzar error crítico si el registro falla
      // El pago ya fue procesado por Stripe
      console.warn('⚠️ Pago procesado por Stripe pero no registrado en BD local');
      
      return {
        success: false,
        error: error.message,
        payment_intent_id: paymentData.paymentIntentId
      };
    }
  }

  /**
   * Obtener historial de pagos del usuario
   * @returns {Promise<Array>} - Lista de pagos
   */
  async getPaymentHistory() {
    try {
      const response = await api.get('/payments/history/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un pago específico
   * @param {string} paymentIntentId - ID del PaymentIntent
   * @returns {Promise<Object>} - Detalles del pago
   */
  async getPaymentDetails(paymentIntentId) {
    try {
      const response = await api.get(`/payments/details/${paymentIntentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles del pago:', error);
      throw error;
    }
  }
}

export default new PaymentService();