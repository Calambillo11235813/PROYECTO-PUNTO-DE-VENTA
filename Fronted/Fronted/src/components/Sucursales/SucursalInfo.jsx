import React, { useState, useEffect } from 'react';
import { FaBuilding, FaInfoCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * Componente que muestra información sobre la sucursal actual
 * y puede ser reutilizado en diferentes partes de la aplicación
 */
const SucursalInfo = ({ type = 'banner', entityName = 'elementos' }) => {
  const [sucursal, setSucursal] = useState({
    id: localStorage.getItem('sucursal_actual_id'),
    nombre: localStorage.getItem('sucursal_actual_nombre')
  });

  useEffect(() => {
    // Actualizar cuando cambia la sucursal
    const handleSucursalChange = () => {
      setSucursal({
        id: localStorage.getItem('sucursal_actual_id'),
        nombre: localStorage.getItem('sucursal_actual_nombre')
      });
    };
    
    window.addEventListener('sucursalChanged', handleSucursalChange);
    return () => {
      window.removeEventListener('sucursalChanged', handleSucursalChange);
    };
  }, []);

  if (type === 'banner') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaBuilding className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Mostrando {entityName} de la sucursal: <strong>{sucursal.nombre || "No seleccionada"}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'inline') {
    return (
      <div className="inline-flex items-center text-sm text-gray-600">
        <FaBuilding className="mr-1 text-blue-500" />
        <span>Sucursal: <strong className="text-blue-600">{sucursal.nombre || "No seleccionada"}</strong></span>
      </div>
    );
  }
  
  if (type === 'tooltip') {
    return (
      <div className="relative group">
        <FaInfoCircle className="text-blue-500 cursor-help" />
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white p-2 rounded shadow-lg border border-gray-200 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
          Mostrando {entityName} de la sucursal: <strong>{sucursal.nombre || "No seleccionada"}</strong>
        </div>
      </div>
    );
  }
  
  // Por defecto, devolver formato badge
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <FaBuilding className="mr-1" />
      {sucursal.nombre || "Sin sucursal"}
    </span>
  );
};

SucursalInfo.propTypes = {
  type: PropTypes.oneOf(['banner', 'inline', 'badge', 'tooltip']),
  entityName: PropTypes.string
};

export default SucursalInfo;