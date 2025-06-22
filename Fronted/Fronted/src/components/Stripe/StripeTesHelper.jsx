// src/components/StripeTestHelper.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StripeTestHelper = ({ onCardSelect, onAutoFill, onClear }) => {
  const [selectedCard, setSelectedCard] = useState('4242424242424242');
  
  const testCards = [
    { number: '4242424242424242', description: 'Visa - Éxito', cvc: '123', expiry: '12/28' },
    { number: '4000000000000002', description: 'Visa - Rechazada', cvc: '123', expiry: '12/28' },
    { number: '4000000000009995', description: 'Visa - Fondos insuficientes', cvc: '123', expiry: '12/28' },
    { number: '4000000000000069', description: 'Visa - Tarjeta expirada', cvc: '123', expiry: '12/20' },
    { number: '4000002500003155', description: 'Visa - Requiere autenticación', cvc: '123', expiry: '12/28' }
  ];

  // ✅ FUNCIÓN PARA LIMPIAR FORMULARIO
  const clearForm = () => {
    console.log('🧹 Limpiando formulario de pago...');
    
    // Limpiar inputs de Stripe
    const stripeInputs = document.querySelectorAll('input[data-elements-stable-field-name]');
    stripeInputs.forEach(input => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Callback para el componente padre
    onClear?.();
    
    toast.info('Formulario limpiado');
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Número copiado al portapapeles');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Número copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar el número');
    }
  };

  const handleCardSelect = (cardNumber) => {
    setSelectedCard(cardNumber);
    onCardSelect?.(cardNumber);
  };

  const autoFillCard = (card) => {
    const cardData = {
      number: card.number,
      expiry: card.expiry,
      cvv: card.cvc,
      postalCode: '12345'
    };
    
    // Simular entrada de datos en Stripe Elements
    setTimeout(() => {
      const numberInput = document.querySelector('input[data-elements-stable-field-name="cardNumber"]');
      const expiryInput = document.querySelector('input[data-elements-stable-field-name="cardExpiry"]');
      const cvcInput = document.querySelector('input[data-elements-stable-field-name="cardCvc"]');
      const postalInput = document.querySelector('input[data-elements-stable-field-name="postalCode"]');

      if (numberInput) {
        numberInput.focus();
        numberInput.value = card.number;
        numberInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      setTimeout(() => {
        if (expiryInput) {
          expiryInput.focus();
          expiryInput.value = card.expiry;
          expiryInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 200);
      
      setTimeout(() => {
        if (cvcInput) {
          cvcInput.focus();
          cvcInput.value = card.cvc;
          cvcInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 400);
      
      setTimeout(() => {
        if (postalInput) {
          postalInput.focus();
          postalInput.value = '12345';
          postalInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 600);
    }, 100);
    
    onAutoFill?.(cardData);
    toast.info('Datos de tarjeta rellenados automáticamente');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-yellow-800">
          🧪 Modo de Pruebas - Tarjetas de Teste
        </h3>
        <button
          onClick={clearForm}
          className="bg-red-100 hover:bg-red-200 text-red-800 text-sm px-3 py-1 rounded-md transition-colors"
        >
          🧹 Limpiar Formulario
        </button>
      </div>
      
      <div className="space-y-2">
        {testCards.map((card, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
              selectedCard === card.number 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleCardSelect(card.number)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                checked={selectedCard === card.number}
                onChange={() => handleCardSelect(card.number)}
                className="mr-3"
              />
              <div>
                <code className="font-mono text-sm">{card.number}</code>
                <span className="ml-2 text-sm text-gray-600">{card.description}</span>
                <div className="text-xs text-gray-500">
                  CVC: {card.cvc} | Expiry: {card.expiry}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(card.number);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100"
              >
                Copiar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  autoFillCard(card);
                }}
                className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-100"
              >
                Auto-rellenar
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-yellow-700">
        <p><strong>Nota:</strong> Los datos se mantienen hasta limpiar manualmente o cerrar completamente el modal.</p>
      </div>
    </div>
  );
};

export default StripeTestHelper;