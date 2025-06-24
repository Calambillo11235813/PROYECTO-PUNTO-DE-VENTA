import React from 'react';
import { useNavigate } from 'react-router-dom';

const SucursalIndicator = ({ sucursalNombre, sucursalId }) => {
  const navigate = useNavigate();
  
  const handleChangeSucursal = () => {
    navigate('/admin/sucursales');
  };
  
  return (
    <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">Sucursal actual:</span>
        <span className="font-medium text-blue-700">{sucursalNombre || 'Sin seleccionar'}</span>
      </div>
      <button 
        onClick={handleChangeSucursal}
        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
      >
        Cambiar
      </button>
    </div>
  );
};

export default SucursalIndicator;