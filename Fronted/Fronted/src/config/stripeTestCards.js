export const TEST_CARDS = [
  { 
    number: '4242424242424242', 
    description: 'Visa - Éxito',
    brand: 'visa',
    scenario: 'success'
  },
  { 
    number: '4000000000000002', 
    description: 'Visa - Rechazada',
    brand: 'visa',
    scenario: 'declined'
  },
  { 
    number: '4000000000009995', 
    description: 'Visa - Fondos insuficientes',
    brand: 'visa',
    scenario: 'insufficient_funds'
  },
  { 
    number: '4000000000000069', 
    description: 'Visa - Tarjeta expirada',
    brand: 'visa',
    scenario: 'expired_card'
  },
  { 
    number: '4000002500003155', 
    description: 'Visa - Requiere autenticación',
    brand: 'visa',
    scenario: 'authentication_required'
  }
];

export const TEST_CARD_INFO = {
  cvv: 'Cualquier 3 dígitos (ej: 123)',
  expiry: 'Cualquier fecha futura (ej: 12/25)',
  postalCode: 'Cualquier código válido (ej: 12345)'
};