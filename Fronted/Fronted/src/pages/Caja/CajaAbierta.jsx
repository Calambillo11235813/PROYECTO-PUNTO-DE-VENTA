import React from 'react';
import { Clock, User, DollarSign, CreditCard, ShoppingCart, Smartphone, LogOut, Store } from 'lucide-react';
import MovimientosList from './MovimientosList';

const CajaAbierta = ({ cajaActual, movimientos, empleados, navigate, setShowMovimientoModal, setShowCierreModal, sucursalActual }) => {
  console.log('🏪 Renderizando CajaAbierta para sucursal:', sucursalActual);
  console.log('💰 Datos de caja actual:', cajaActual);
  
  return (
    <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800 flex items-center">
              Caja - Abierta
              {sucursalActual?.id && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                  <Store className="h-3 w-3 mr-1" /> {sucursalActual.nombre}
                </span>
              )}
            </h2>
            <p className="flex items-center text-gray-600 mb-2">
              <Clock className="h-4 w-4 mr-1" />
              Abierta el {new Date(cajaActual.fecha_apertura).toLocaleString()}
            </p>
            {cajaActual.empleado && (
              <p className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-1" />
                Empleado asignado: {
                  typeof cajaActual.empleado === 'number' 
                    ? empleados.find(emp => emp.id === cajaActual.empleado)?.nombre + ' ' + empleados.find(emp => emp.id === cajaActual.empleado)?.apellido 
                    : cajaActual.empleado
                }
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              Activa
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-blue-900">Monto Inicial</h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-blue-700 mt-2">
            ${Number(cajaActual.monto_inicial).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-amber-900">Movimientos</h3>
            <CreditCard className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold text-amber-700 mt-2">
            {movimientos.length} {movimientos.length === 1 ? 'registro' : 'registros'}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Sucursal: {sucursalActual?.nombre || cajaActual.sucursal || 'N/A'}
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-purple-900">Total Ventas</h3>
            <ShoppingCart className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-semibold text-purple-700 mt-2">
            ${(cajaActual.total_ventas || 0).toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            En sucursal actual: {sucursalActual?.nombre || 'N/A'}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-green-900">Balance Actual</h3>
            <Smartphone className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-700 mt-2">
            ${(cajaActual.balance_actual || Number(cajaActual.monto_inicial)).toFixed(2)}
          </p>
        </div>
      </div>
      
      <MovimientosList
        movimientos={movimientos}
        setShowMovimientoModal={setShowMovimientoModal}
        sucursalActual={sucursalActual}
      />
      
      <div className="p-6 border-t bg-gray-50 flex justify-between">
        <button
          onClick={() => navigate('/admin/ventas')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          Ir a Punto de Venta
        </button>
        
        <button
          onClick={() => setShowCierreModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
        >
          <LogOut className="h-5 w-5 mr-1" />
          Cerrar Caja
        </button>
      </div>
    </div>
  );
};

export default CajaAbierta;