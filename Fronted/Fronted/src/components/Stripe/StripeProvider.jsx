// src/components/StripeProvider.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../../config/stripe';
import PropTypes from 'prop-types';

const StripeProvider = React.memo(({ children, clientSecret, theme = {}, onError }) => {
  const [stripeError, setStripeError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // ✅ OPCIONES CORREGIDAS Y SIMPLIFICADAS
  const options = useMemo(() => {
    // ✅ VALIDACIÓN CRÍTICA DEL CLIENT SECRET
    if (!clientSecret || typeof clientSecret !== 'string') {
      console.warn('⚠️ ClientSecret inválido:', clientSecret);
      return null;
    }

    // ✅ CONFIGURACIÓN MÍNIMA Y SEGURA
    const stripeOptions = {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#22c55e',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
          spacingUnit: '4px'
        }
      },
      // ✅ NO INCLUIR amount NI otras opciones problemáticas
      loader: 'auto'
    };

    console.log('✅ Opciones de Stripe configuradas:', {
      hasClientSecret: !!stripeOptions.clientSecret,
      clientSecretLength: stripeOptions.clientSecret?.length,
      appearance: !!stripeOptions.appearance
    });

    return stripeOptions;
  }, [clientSecret]); // ✅ SOLO clientSecret como dependencia

  // ✅ EFECTO PARA VALIDAR Y PREPARAR
  useEffect(() => {
    if (clientSecret) {
      console.log('🔄 Preparando Stripe Elements...');
      setIsReady(true);
      setStripeError(null);
    } else {
      setIsReady(false);
    }
  }, [clientSecret]);

  // ✅ VALIDACIÓN DE STRIPE PROMISE
  useEffect(() => {
    const validateStripe = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe no pudo inicializarse');
        }
        console.log('✅ Stripe cargado correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar Stripe:', error);
        setStripeError(error.message);
        onError?.(error);
      }
    };
    
    validateStripe();
  }, [onError]);

  // ✅ CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando StripeProvider...');
      setIsReady(false);
    };
  }, []);

  // ✅ MANEJO DE ERRORES
  if (stripeError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error al configurar el procesador de pagos
            </h3>
            <p className="text-sm text-red-700 mt-1">{stripeError}</p>
            <button 
              onClick={() => {
                setStripeError(null);
                setIsReady(true);
              }}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN ANTES DE RENDERIZAR
  if (!clientSecret || !isReady || !options) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center justify-center p-8">
        <span className="sr-only">Cargando opciones de pago</span>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600">Preparando opciones de pago...</p>
      </div>
    );
  }

  // ✅ RENDERIZADO SEGURO CON ERROR BOUNDARY IMPLÍCITO
  return (
    <div className="stripe-provider-container">
      <Elements 
        stripe={stripePromise} 
        options={options}
        key={clientSecret} // ✅ KEY ESTABLE BASADA SOLO EN clientSecret
      >
        {children}
      </Elements>
    </div>
  );
});

StripeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  clientSecret: PropTypes.string,
  theme: PropTypes.object,
  onError: PropTypes.func
};

StripeProvider.displayName = 'StripeProvider';

export default StripeProvider;