import React from 'react';
import { Store } from 'lucide-react';

const MovimientosList = ({ movimientos, setShowMovimientoModal, sucursalActual }) => {
  // Log para depuración
  console.log('🏪 MovimientosList para sucursal:', sucursalActual);
  console.log('📊 Movimientos a mostrar:', movimientos);
  
  return (
    <div className="p-6 border-t">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          Movimientos de Efectivo
          {sucursalActual?.id && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
              <Store className="h-3 w-3 mr-1" /> {sucursalActual.nombre}
            </span>
          )}
        </h3>
        <button 
          onClick={() => setShowMovimientoModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
          disabled={!sucursalActual?.id}
        >
          <span className="mr-1">+</span> Nuevo Movimiento
        </button>
      </div>
      
      <div className="overflow-x-auto">
        {movimientos.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                {/* Nueva columna para sucursal */}
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{new Date(mov.fecha).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    <span className={`${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                      ${Number(mov.monto).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">{mov.descripcion}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className="flex items-center">
                      <Store className="h-3 w-3 mr-1 text-blue-500" />
                      {sucursalActual?.nombre || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {!sucursalActual?.id ? 
              "Seleccione una sucursal para ver los movimientos" : 
              "No hay movimientos registrados en esta sucursal"}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovimientosList;