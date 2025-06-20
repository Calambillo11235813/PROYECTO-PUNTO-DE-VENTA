import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const PlanLimitAlert = ({ isOpen, message, onClose, onUpgrade }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center mb-4 text-amber-500">
          <FaExclamationTriangle className="w-8 h-8 mr-3" />
          <h3 className="text-lg font-bold">Límite de plan alcanzado</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message || "Has alcanzado el límite de tu plan actual."}
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Entendido
          </button>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Actualizar mi plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitAlert;