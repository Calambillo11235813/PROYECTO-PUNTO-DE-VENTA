// src/config/stripe.js
import { loadStripe } from '@stripe/stripe-js';

// Verificar que la clave está presente
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('⚠️ ERROR: Clave pública de Stripe no encontrada en variables de entorno');
}

const stripePromise = loadStripe(stripeKey);
console.log('✅ Stripe configurado y listo para usar');

export default stripePromise;