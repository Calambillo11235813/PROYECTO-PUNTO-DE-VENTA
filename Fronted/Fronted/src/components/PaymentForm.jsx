// src/components/PaymentForm.jsx
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentService from '../services/paymentService';

const PaymentForm = ({ amount, currency = 'usd', description = '', onSuccess, onError, isRegistration = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        throw result.error;
      }

      onSuccess(result.paymentIntent);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Error al procesar el pago');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement />
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        <button 
          type="submit" 
          disabled={!stripe || loading}
          className="hidden" // Oculto ya que usamos el botón externo
        >
          Pagar
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;