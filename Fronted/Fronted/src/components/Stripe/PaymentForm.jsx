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
  const formRef = useRef(null);

  // ✅ VALIDACIÓN DE PROPS AL INICIALIZAR
  useEffect(() => {
    console.log('🔍 PaymentForm inicializado con:', {
      amount,
      currency,
      description,
      hasStripe: !!stripe,
      hasElements: !!elements
    });

    // ✅ VALIDAR AMOUNT
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('❌ Amount inválido en PaymentForm:', amount);
      setError('Monto de pago inválido');
      onError?.(new Error('Monto de pago inválido'));
      return;
    }

    setIsReady(true);
  }, [amount, currency, stripe, elements]);

  // ✅ INFORMAR CAMBIOS DE LOADING
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // ✅ CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando PaymentForm...');
      setError(null);
      setLoading(false);
    };
  }, []);

  // ✅ FUNCIÓN PARA LIMPIAR ELEMENTOS PROBLEMÁTICOS
  const cleanupStripeDOM = useCallback(() => {
    try {
      // Buscar y limpiar elementos problemáticos de Stripe Link
      const hiddenElements = document.querySelectorAll('[aria-hidden="true"] input, [aria-hidden="true"] button');
      hiddenElements.forEach(element => {
        if (element.matches(':focus')) {
          element.blur();
        }
      });

      // Limpiar elementos específicos de Stripe Link
      const linkElements = document.querySelectorAll('.p-CodePuncher-controllingInput, .p-LogoutMenu, .p-Picker-change');
      linkElements.forEach(element => {
        if (element.style) {
          element.style.display = 'none';
        }
      });
    } catch (error) {
      console.warn('⚠️ Error al limpiar DOM de Stripe:', error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ VALIDACIONES CRÍTICAS
    if (!stripe || !elements) {
      const error = new Error('Stripe no está disponible');
      console.error('❌', error.message);
      setError(error.message);
      onError(error);
      return;
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      const error = new Error('El monto debe ser mayor a 0');
      console.error('❌', error.message);
      setError(error.message);
      onError(error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando confirmación de pago...');
      
      // ✅ LIMPIAR DOM ANTES DE PROCESAR
      cleanupStripeDOM();

      // ✅ SOLUCIÓN: CONFIGURAR BILLING DETAILS COMPLETOS
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
          // ✅ AGREGAR BILLING DETAILS REQUERIDOS
          payment_method_data: {
            billing_details: {
              name: 'Usuario Anónimo', // Valor por defecto
              email: null, // Stripe lo obtendrá del PaymentElement
              phone: null, // ✅ CRÍTICO: Proporcionar valor null explícito
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

      // ✅ LIMPIAR DOM DESPUÉS DEL ÉXITO
      setTimeout(cleanupStripeDOM, 100);

      // Continuar con el flujo principal
      onSuccess(result.paymentIntent, result);
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      const errorMessage = error.message || 'Error al procesar el pago';
      setError(errorMessage);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MOSTRAR LOADING SI NO ESTÁ LISTO
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
        options={{
          // ✅ CONFIGURACIÓN CORREGIDA Y SIMPLIFICADA
          fields: {
            billingDetails: {
              name: 'auto', // Mostrar campo nombre
              email: 'auto', // Mostrar campo email
              phone: 'auto', // ✅ CAMBIADO: Mostrar campo teléfono
              address: {
                country: 'never',
                line1: 'never',
                line2: 'never',
                city: 'never',
                state: 'never',
                postalCode: 'auto' // Mostrar código postal
              }
            }
          },
          // ✅ DESHABILITAR ELEMENTOS PROBLEMÁTICOS
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