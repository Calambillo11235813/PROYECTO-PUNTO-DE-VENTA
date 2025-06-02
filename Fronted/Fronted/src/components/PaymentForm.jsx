// src/components/PaymentForm.jsx
import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { 
  CreditCardIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/solid';
import paymentService from '../services/paymentService';

const PaymentForm = ({ 
  amount, 
  currency = 'usd', 
  description = '',
  onSuccess,
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Crear PaymentIntent cuando el componente se monta
  React.useEffect(() => {
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const result = await paymentService.createPaymentIntent(
        amount, 
        currency, 
        description
      );
      
      setClientSecret(result.client_secret);
      setPaymentIntentId(result.stripe_payment_intent_id);
    } catch (err) {
      setError('Error al inicializar el pago');
      console.error('Error creating payment intent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message);
        if (onError) onError(stripeError);
      } else if (paymentIntent) {
        // Confirmar en el backend
        const confirmResult = await paymentService.confirmPayment(paymentIntent.id);
        
        if (paymentIntent.status === 'succeeded') {
          if (onSuccess) onSuccess(paymentIntent, confirmResult);
        }
      }
    } catch (err) {
      setError('Error al procesar el pago');
      console.error('Payment error:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Inicializando pago...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <CreditCardIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          Información de Pago
        </h2>
        <p className="text-gray-600">
          Total: ${amount.toFixed(2)} {currency.toUpperCase()}
        </p>
      </div>

      {/* Mensaje de seguridad */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            Pago seguro con encriptación SSL de 256 bits
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Elemento de pago de Stripe */}
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />

        {/* Dirección de facturación */}
        <AddressElement 
          options={{
            mode: 'billing',
            allowedCountries: ['US', 'CA', 'MX'],
          }}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            loading || !stripe
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando...
            </div>
          ) : (
            `Pagar $${amount.toFixed(2)}`
          )}
        </button>
      </form>

      {/* Footer de seguridad */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by Stripe • Tu información está protegida
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;