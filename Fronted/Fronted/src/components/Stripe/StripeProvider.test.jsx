import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StripeProvider from './StripeProvider';

// Mock de stripePromise
jest.mock('../../config/stripe', () => ({
  __esModule: true,
  default: Promise.resolve({
    elements: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
}));

describe('StripeProvider', () => {
  it('should render loading state without clientSecret', () => {
    render(
      <StripeProvider>
        <div>Test Child</div>
      </StripeProvider>
    );
    expect(screen.getByText('Cargando opciones de pago...')).toBeInTheDocument();
  });
  
  it('should render children when clientSecret is provided', async () => {
    render(
      <StripeProvider clientSecret="pi_test_1234567890">
        <div>Test Child</div>
      </StripeProvider>
    );
    
    // Esperar a que se renderice el contenido
    await screen.findByText('Test Child');
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should handle stripe initialization error', async () => {
    // Mock stripe to return null
    jest.doMock('../../config/stripe', () => ({
      __esModule: true,
      default: Promise.resolve(null),
    }));

    const onErrorMock = jest.fn();
    
    render(
      <StripeProvider clientSecret="pi_test" onError={onErrorMock}>
        <div>Test Child</div>
      </StripeProvider>
    );

    // Verificar que se muestra el mensaje de error
    await screen.findByText('Error al configurar el procesador de pagos');
    expect(screen.getByText('Error al configurar el procesador de pagos')).toBeInTheDocument();
  });
});