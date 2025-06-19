// src/components/StripeProvider.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../../config/stripe';
import PropTypes from 'prop-types';

const StripeProvider = React.memo(({ children, clientSecret, theme = {}, onError }) => {
  const [stripeError, setStripeError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  const lastClientSecretRef = useRef(null);
  
  // ✅ KEY ULTRA-ESTABLE CON HASH SIMPLE
  const stableKey = useMemo(() => {
    if (!clientSecret || typeof clientSecret !== 'string') {
      return null;
    }
    
    // Hash simple para crear key estable
    let hash = 0;
    for (let i = 0; i < clientSecret.length; i++) {
      const char = clientSecret.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `stripe-${Math.abs(hash)}`;
  }, [clientSecret]);

  // ✅ OPCIONES ESTABLES - MEMO MÁS RESTRICTIVO
  const options = useMemo(() => {
    if (!clientSecret || typeof clientSecret !== 'string') {
      console.warn('⚠️ ClientSecret inválido:', clientSecret);
      return null;
    }

    return {
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
      loader: 'auto'
    };
  }, [clientSecret]);

  // ✅ EFECTO CONTROLADO SIN RE-RENDERS INNECESARIOS
  useEffect(() => {
    // Si es el mismo clientSecret, no hacer nada
    if (lastClientSecretRef.current === clientSecret) {
      return;
    }
    
    mountedRef.current = true;
    lastClientSecretRef.current = clientSecret;
    
    if (clientSecret && options && stableKey) {
      console.log('🔄 Preparando Stripe Elements con key ESTABLE:', stableKey);
      setIsReady(false);
      setStripeError(null);
      
      // Marcar como listo inmediatamente
      setIsReady(true);
      console.log('✅ StripeProvider listo con key:', stableKey);
    }

    return () => {
      console.log('🧹 Limpiando StripeProvider para key:', stableKey);
      mountedRef.current = false;
    };
  }, [clientSecret, stableKey]); // ✅ Solo depender de clientSecret y stableKey

  // ✅ VALIDACIÓN DE STRIPE SOLO UNA VEZ
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
        if (mountedRef.current) {
          setStripeError(error.message);
          onError?.(error);
        }
      }
    };
    
    validateStripe();
  }, []); // ✅ Solo una vez al montar

  // Manejo de errores
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
                setIsReady(false);
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

  // Estado de carga
  if (!clientSecret || !isReady || !options || !stableKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600">Preparando opciones de pago...</p>
      </div>
    );
  }

  // ✅ RENDERIZADO CON KEY ULTRA-ESTABLE
  return (
    <div className="stripe-provider-container">
      <Elements 
        stripe={stripePromise} 
        options={options}
        key={stableKey}
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