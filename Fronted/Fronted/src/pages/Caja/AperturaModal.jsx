import React, { useEffect, useRef, useState } from 'react';
import { X, DollarSign, User, LogIn, Store } from 'lucide-react';
import empleadoService from '../../services/EmpleadoService';

const AperturaModal = ({ 
  setShowAperturaModal,
  montoInicial,
  setMontoInicial,
  empleadoId,
  setEmpleadoId,
  empleados,
  setEmpleados, // Añadir esta prop para actualizar los empleados
  loadingEmpleados,
  setLoadingEmpleados, // Añadir esta prop para actualizar el estado de carga
  isLoading,
  handleAbrirCaja,
  sucursalActual // Prop para sucursal
}) => {
  const montoInputRef = useRef(null);

  // Cargar empleados específicos de la sucursal seleccionada
  useEffect(() => {
    const fetchEmpleadosBySucursal = async () => {
      if (sucursalActual?.id) {
        try {
          setLoadingEmpleados(true);
          const userId = localStorage.getItem('id');
          
          // Usar el servicio para obtener empleados por sucursal
          const empleadosSucursal = await empleadoService.getEmpleadosBySucursal(
            userId,
            sucursalActual.id
          );
          
          console.log(`🧑‍💼 Empleados cargados para la sucursal ${sucursalActual.nombre}:`, empleadosSucursal);
          
          // Actualizar el estado de empleados con los filtrados por sucursal
          setEmpleados(empleadosSucursal || []);
          
          // Si no hay empleados seleccionados pero hay disponibles, seleccionar el primero
          if (!empleadoId && empleadosSucursal?.length > 0) {
            setEmpleadoId(empleadosSucursal[0].id.toString());
          }
        } catch (error) {
          console.error('Error al cargar empleados por sucursal:', error);
          setEmpleados([]);
        } finally {
          setLoadingEmpleados(false);
        }
      }
    };

    fetchEmpleadosBySucursal();
    
    if (montoInputRef.current) {
      montoInputRef.current.focus();
    }
    
    console.log('🏪 Datos de sucursal en modal apertura:', sucursalActual);
  }, [sucursalActual?.id, setEmpleados, setEmpleadoId, setLoadingEmpleados]);
  
  // Función para guardar el monto en la referencia cuando cambie
  const handleMontoChange = (e) => {
    // Validar el formato del monto antes de actualizar el estado
    const value = e.target.value;
    const regex = /^\d*\.?\d*$/;
    
    if (value === '' || regex.test(value)) {
      setMontoInicial(value);
    }
  };
  
  // Función para guardar la selección de empleado sin perder el monto
  const handleEmpleadoChange = (e) => {
    setEmpleadoId(e.target.value);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Apertura de Caja</h2>
          <button 
            onClick={() => setShowAperturaModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mostrar información de la sucursal con estilo destacado */}
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center">
            <Store className="h-5 w-5 text-blue-500 mr-2" />
            <span className="font-medium text-blue-700">Sucursal:</span>
            <span className="ml-2 font-bold">{sucursalActual?.nombre || 'No seleccionada'}</span>
          </div>
          {!sucursalActual?.id && (
            <div className="text-sm text-red-500 mt-2 flex items-center">
              <span className="mr-1">⚠️</span>
              No se ha seleccionado una sucursal. Debe seleccionar una sucursal antes de abrir la caja.
            </div>
          )}
          {sucursalActual?.id && (
            <div className="text-xs text-blue-600 mt-1">
              ID: {sucursalActual.id} - La caja quedará asociada a esta sucursal.
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Monto Inicial (Bs)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={montoInputRef}
              type="text"
              value={montoInicial}
              onChange={handleMontoChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2 justify-between items-center">
            <span>Empleado Asignado</span>
            {empleados.length === 0 && !loadingEmpleados && (
              <span className="text-xs text-orange-500 font-normal">
                No hay empleados en esta sucursal
              </span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            {loadingEmpleados ? (
              <div className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-500">
                Cargando empleados...
              </div>
            ) : (
              <select
                value={empleadoId}
                onChange={handleEmpleadoChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={empleados.length === 0}
              >
                <option value="">Seleccione un empleado</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido || ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          {empleados.length === 0 && !loadingEmpleados && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                Esta sucursal no tiene empleados asignados. Puede continuar sin asignar un empleado o primero agregar empleados a la sucursal.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Vaya a "Gestión de Empleados" para asignar empleados a esta sucursal.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowAperturaModal(false)}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isLoading || loadingEmpleados}
          >
            Cancelar
          </button>
          <button
            onClick={handleAbrirCaja}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            disabled={isLoading || loadingEmpleados || !sucursalActual?.id}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Procesando...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-1" />
                Abrir Caja
              </>
            )}
          </button>
        </div>
        
        {!sucursalActual?.id && (
          <div className="mt-4 text-sm text-red-500">
            No se puede abrir la caja sin seleccionar una sucursal.
          </div>
        )}
      </div>
    </div>
  );
};

export default AperturaModal;