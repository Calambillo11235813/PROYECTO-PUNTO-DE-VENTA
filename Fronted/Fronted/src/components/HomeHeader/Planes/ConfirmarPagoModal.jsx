import React, { useState } from 'react';
import { 
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

const PaymentModal = ({ plan, isOpen, onClose, onConfirm, loading }) => {
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    accountNumber: '',
    bankName: ''
  });

  const paymentMethods = [
    {
      id: 'tarjeta',
      name: 'Tarjeta de Crédito/Débito',
      icon: <CreditCardIcon className="h-5 w-5" />,
      description: 'Pago seguro con tarjeta'
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria',
      icon: <BuildingLibraryIcon className="h-5 w-5" />,
      description: 'Transferencia directa'
    },
    {
      id: 'efectivo',
      name: 'Pago en Efectivo',
      icon: <BanknotesIcon className="h-5 w-5" />,
      description: 'Pago en oficinas autorizadas'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const paymentData = {
      plan_id: plan.id,
      metodo_pago: paymentMethod,
      monto_pagado: plan.precio,
      fecha_inicio: new Date().toISOString(),
      fecha_expiracion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      referencia_pago: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    onConfirm(paymentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirmar Suscripción</h2>
            <p className="text-gray-600 mt-1">Plan {plan?.nombre} - Bs. {plan?.precio}/año</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Resumen del plan */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen del Plan</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="ml-2 font-medium capitalize">{plan?.nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">Precio:</span>
                <span className="ml-2 font-medium">Bs. {plan?.precio}/año</span>
              </div>
              <div>
                <span className="text-gray-600">Productos:</span>
                <span className="ml-2 font-medium">
                  {plan?.max_productos === 0 ? 'Ilimitados' : plan?.max_productos}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Empleados:</span>
                <span className="ml-2 font-medium">{plan?.max_empleados}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Método de Pago</h3>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`mr-3 ${paymentMethod === method.id ? 'text-green-600' : 'text-gray-400'}`}>
                      {method.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>

            {/* Campos específicos del método de pago */}
            {paymentMethod === 'tarjeta' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titular de la Tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={paymentDetails.holderName}
                      onChange={(e) => setPaymentDetails({...paymentDetails, holderName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Expiración
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={paymentDetails.expiryDate}
                      onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'transferencia' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Datos para Transferencia</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Banco:</strong> Banco Nacional de Bolivia</p>
                  <p><strong>Cuenta:</strong> 1234567890</p>
                  <p><strong>Titular:</strong> PuntoVenta SaaS</p>
                  <p><strong>Monto:</strong> Bs. {plan?.precio}</p>
                </div>
              </div>
            )}

            {paymentMethod === 'efectivo' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-amber-900 mb-2">Pago en Efectivo</h4>
                <p className="text-sm text-amber-800">
                  Visite cualquiera de nuestras oficinas autorizadas para realizar el pago en efectivo.
                  Su suscripción se activará una vez confirmado el pago.
                </p>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4" />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;