// src/components/StripeProvider.jsx
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../config/stripe';

const StripeProvider = ({ children }) => {
  const options = {
    // Configuraciones adicionales
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider;