// src/components/PaymentForm.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PropTypes from 'prop-types';

const PaymentForm = ({ 
  amount, 
  currency = 'usd', 
  description = '', 
  onSuccess, 
  onError, 
  onLoadingChange,
  isRegistration = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const formRef = useRef(null);
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  // ✅ VALIDACIÓN Y PREPARACIÓN INICIAL
  useEffect(() => {
    mountedRef.current = true;
    submittingRef.current = false;
    
    console.log('🔍 PaymentForm inicializado:', {
      amount,
      currency,
      description,
      hasStripe: !!stripe,
      hasElements: !!elements,
      paymentElementReady
    });

    // Validar amount
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('❌ Amount inválido:', amount);
      setError('Monto de pago inválido');
      onError?.(new Error('Monto de pago inválido'));
      return;
    }

    // Solo marcar como listo cuando todo esté disponible
    if (stripe && elements) {
      setIsReady(true);
      setError(null);
    }

    return () => {
      console.log('🧹 Limpiando PaymentForm...');
      mountedRef.current = false;
      submittingRef.current = false;
    };
  }, [amount, currency, stripe, elements, paymentElementReady]);

  // ✅ INFORMAR CAMBIOS DE LOADING
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // ✅ CALLBACK PARA CUANDO EL PAYMENT ELEMENT ESTÉ LISTO
  const handlePaymentElementReady = useCallback(() => {
    if (mountedRef.current) {
      console.log('✅ PaymentElement montado y listo');
      setPaymentElementReady(true);
    }
  }, []);

  // ✅ CALLBACK PARA ERRORES DEL PAYMENT ELEMENT
  const handlePaymentElementError = useCallback((event) => {
    if (mountedRef.current) {
      console.error('❌ Error en PaymentElement:', event.error);
      setError(event.error.message);
    }
  }, []);

  // ✅ FUNCIÓN DE ENVÍO SIN DELAY PROBLEMÁTICO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ PREVENIR DOBLE SUBMIT
    if (submittingRef.current) {
      console.log('⚠️ Ya hay un pago en proceso, ignorando...');
      return;
    }
    
    // Validaciones críticas
    if (!stripe || !elements) {
      const error = new Error('Stripe no está disponible');
      console.error('❌', error.message);
      setError(error.message);
      onError(error);
      return;
    }

    if (!paymentElementReady) {
      const error = new Error('Formulario de pago no está listo. Espere un momento.');
      console.error('❌', error.message);
      setError(error.message);
      return;
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      const error = new Error('El monto debe ser mayor a 0');
      console.error('❌', error.message);
      setError(error.message);
      onError(error);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando confirmación de pago...');
      
      // ✅ VERIFICACIONES INMEDIATAS SIN DELAY
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        throw new Error('El elemento de pago no está disponible');
      }

      // ✅ VERIFICAR QUE EL COMPONENTE SIGUE MONTADO
      if (!mountedRef.current) {
        console.log('⚠️ Componente desmontado, cancelando pago...');
        return;
      }

      console.log('✅ Todas las validaciones pasadas, procesando pago INMEDIATAMENTE...');

      // ✅ SIN DELAY - PROCESAR INMEDIATAMENTE
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
          payment_method_data: {
            billing_details: {
              name: 'Cliente',
              email: null,
              phone: null,
              address: {
                country: null,
                line1: null,
                line2: null,
                city: null,
                state: null,
                postal_code: null
              }
            }
          }
        },
        redirect: 'if_required'
      });

      // ✅ VERIFICAR SI EL COMPONENTE SIGUE MONTADO DESPUÉS DEL PAGO
      if (!mountedRef.current) {
        console.log('⚠️ Componente desmontado durante el pago');
        return;
      }

      console.log('📋 Resultado de confirmPayment:', result);

      if (result.error) {
        console.error('❌ Error en confirmPayment:', result.error);
        throw result.error;
      }

      console.log('🎉 Pago procesado exitosamente:', {
        paymentIntentId: result.paymentIntent.id,
        amount,
        currency,
        status: result.paymentIntent.status
      });

      // ✅ VERIFICAR ANTES DE LLAMAR CALLBACK
      if (mountedRef.current && onSuccess) {
        onSuccess(result.paymentIntent, result);
      }
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      
      if (mountedRef.current) {
        const errorMessage = error.message || 'Error al procesar el pago';
        setError(errorMessage);
        onError(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      submittingRef.current = false;
    }
  };

  // ✅ MOSTRAR LOADING MEJORADO
  if (!isReady || !stripe || !elements) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600">Cargando formulario de pago...</p>
      </div>
    );
  }

  return (
    <form 
      ref={formRef}
      id="payment-form" 
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <PaymentElement 
        onReady={handlePaymentElementReady}
        onLoaderStart={() => console.log('🔄 PaymentElement cargando...')}
        onLoadError={handlePaymentElementError}
        options={{
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto', 
              phone: 'auto',
              address: {
                country: 'never',
                line1: 'never',
                line2: 'never',
                city: 'never',
                state: 'never',
                postalCode: 'auto'
              }
            }
          },
          terms: {
            card: 'never'
          },
          wallets: {
            applePay: 'never',
            googlePay: 'never'
          }
        }} 
      />
      
      {error && (
        <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* ✅ INDICADOR DE ESTADO MEJORADO */}
      <div className="text-xs text-gray-500 text-center">
        {!paymentElementReady ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2"></div>
            Preparando formulario...
          </span>
        ) : submittingRef.current ? (
          <span className="flex items-center justify-center text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
            Procesando pago...
          </span>
        ) : (
          <span className="text-green-600">✓ Formulario listo para el pago</span>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={!stripe || loading || !paymentElementReady || submittingRef.current}
        className="hidden"
      >
        Pagar
      </button>
    </form>
  );
};

PaymentForm.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  description: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  isRegistration: PropTypes.bool,
  onLoadingChange: PropTypes.func
};

export default PaymentForm;