// src/tests/payment.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentForm from '../components/PaymentForm';
import paymentService from '../services/paymentService';

// Mock del servicio
jest.mock('../services/paymentService');

describe('PaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create payment intent on mount', async () => {
    paymentService.createPaymentIntent.mockResolvedValue({
      client_secret: 'pi_test_123_secret_456',
      stripe_payment_intent_id: 'pi_test_123'
    });

    render(
      <PaymentForm 
        amount={100} 
        currency="usd" 
        description="Test payment" 
      />
    );

    await waitFor(() => {
      expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(
        100, 'usd', 'Test payment'
      );
    });
  });

  test('should show error message on payment failure', async () => {
    paymentService.createPaymentIntent.mockRejectedValue(
      new Error('Network error')
    );

    render(<PaymentForm amount={100} />);

    await waitFor(() => {
      expect(screen.getByText(/Error al inicializar el pago/)).toBeInTheDocument();
    });
  });

  test('should disable submit button when loading', () => {
    render(<PaymentForm amount={100} />);
    
    const submitButton = screen.getByRole('button', { name: /pagar/i });
    expect(submitButton).toBeDisabled();
  });
});