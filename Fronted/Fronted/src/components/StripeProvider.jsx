// src/components/StripeProvider.jsx
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../config/stripe';

const StripeProvider = ({ children, clientSecret }) => {
  console.log('🔍 StripeProvider render con clientSecret:', clientSecret ? 'presente' : 'ausente');
  
  // Verificar que stripePromise está correctamente inicializado
  if (!stripePromise) {
    console.error('❌ stripePromise no está inicializado correctamente');
    return <div>Error al configurar el procesador de pagos</div>;
  }

  // Configuración simplificada sin propiedades problemáticas
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#22c55e',
      }
    },
  };

  // Solo renderizar Elements cuando tengamos un clientSecret
  if (!clientSecret) {
    return <div>Cargando opciones de pago...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider;