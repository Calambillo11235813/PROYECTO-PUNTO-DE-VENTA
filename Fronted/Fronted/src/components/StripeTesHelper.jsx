// src/components/StripeTestHelper.jsx
import React, { useState } from 'react';

const StripeTestHelper = () => {
  const [selectedCard, setSelectedCard] = useState('4242424242424242');
  
  const testCards = [
    { number: '4242424242424242', description: 'Visa - Éxito' },
    { number: '4000000000000002', description: 'Visa - Rechazada' },
    { number: '4000000000009995', description: 'Visa - Fondos insuficientes' },
    { number: '4000000000000069', description: 'Visa - Tarjeta expirada' },
    { number: '4000002500003155', description: 'Visa - Requiere autenticación' }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Número copiado al portapapeles');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">
        🧪 Modo de Pruebas - Tarjetas de Teste
      </h3>
      
      <div className="space-y-2">
        {testCards.map((card, index) => (
          <div 
            key={index}
            className="flex items-center justify-between bg-white p-2 rounded border"
          >
            <div>
              <code className="font-mono text-sm">{card.number}</code>
              <span className="ml-2 text-sm text-gray-600">{card.description}</span>
            </div>
            <button
              onClick={() => copyToClipboard(card.number)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Copiar
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-yellow-700">
        <p><strong>CVV:</strong> Cualquier 3 dígitos (ej: 123)</p>
        <p><strong>Fecha:</strong> Cualquier fecha futura (ej: 12/25)</p>
        <p><strong>Código postal:</strong> Cualquier código válido (ej: 12345)</p>
      </div>
    </div>
  );
};

export default StripeTestHelper;