import React from 'react';
import { Wallet, LogIn, Store } from 'lucide-react';

const CajaCerrada = ({ setShowAperturaModal, sucursalActual }) => {
  console.log('🏪 Renderizando CajaCerrada para sucursal:', sucursalActual);
  
  return (
    <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="shadow-md rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">
        <Wallet className="h-16 w-16 icon-accent" />
      </div>
      
      {/* Mostrar información de sucursal */}
      {sucursalActual?.id && (
        <div className="bg-blue-50 rounded-md p-2 mb-4 inline-flex items-center">
          <Store className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-blue-700 font-medium">{sucursalActual.nombre}</span>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        {sucursalActual?.id 
          ? `No hay una caja abierta en ${sucursalActual.nombre}` 
          : "No hay una caja abierta actualmente"}
      </h2>
      <p className="text-gray-600 mb-6 max-w-lg mx-auto">
        Para comenzar a registrar ventas en {sucursalActual?.nombre || 'esta sucursal'}, primero debe abrir una caja ingresando el monto inicial de efectivo disponible.
      </p>
      <button
        onClick={() => setShowAperturaModal(true)}
        className={`px-6 py-3 text-white rounded-lg flex items-center mx-auto ${
          !sucursalActual?.id 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
        disabled={!sucursalActual?.id}
      >
        <LogIn className="h-5 w-5 mr-2" />
        {sucursalActual?.id 
          ? `Abrir Caja en ${sucursalActual.nombre}` 
          : 'Seleccione una sucursal primero'}
      </button>
      
      {!sucursalActual?.id && (
        <p className="mt-3 text-sm text-red-500">
          ⚠️ Debe seleccionar una sucursal antes de abrir la caja
        </p>
      )}
    </div>
  );
};

export default CajaCerrada;