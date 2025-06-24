import React from 'react';
import ReportEmpty from '../ReportEmpty';
import { FaArrowUp, FaArrowDown, FaExchangeAlt } from 'react-icons/fa';

const MovimientosReport = ({ reportData }) => {
  if (!reportData || !reportData.movimientos || reportData.movimientos.length === 0) {
    return (
      <ReportEmpty
        title="No hay datos de movimientos disponibles"
        message="No se encontraron registros de movimientos de inventario para el período especificado."
      />
    );
  }

  // Función para formatear números de manera segura
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return typeof value === 'number' ? value.toLocaleString() : parseInt(value || 0).toLocaleString();
  };

  // Agrupar movimientos por tipo
  const entradas = reportData.movimientos.filter(m => m.tipo === 'entrada');
  const salidas = reportData.movimientos.filter(m => m.tipo === 'salida');
  const transferencias = reportData.movimientos.filter(m => m.tipo === 'transferencia');

  // Calcular totales
  const totalEntradas = entradas.reduce((sum, m) => sum + (m.cantidad || 0), 0);
  const totalSalidas = salidas.reduce((sum, m) => sum + (m.cantidad || 0), 0);
  const totalTransferencias = transferencias.reduce((sum, m) => sum + (m.cantidad || 0), 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Panel de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaArrowDown className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Entradas</p>
            <p className="text-xl font-semibold">{formatNumber(totalEntradas)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaArrowUp className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Salidas</p>
            <p className="text-xl font-semibold">{formatNumber(totalSalidas)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaExchangeAlt className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Transferencias</p>
            <p className="text-xl font-semibold">{formatNumber(totalTransferencias)}</p>
          </div>
        </div>
      </div>

      {/* Listado de movimientos */}
      <div className="p-4 mb-4 rounded-md" style={{ backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.movimientos.map((movimiento, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${
                  movimiento.tipo === 'entrada' ? 'bg-green-50' :
                  movimiento.tipo === 'salida' ? 'bg-red-50' :
                  'bg-blue-50'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(movimiento.fecha)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{movimiento.producto_nombre || 'Sin nombre'}</div>
                    <div className="text-xs text-gray-500">{movimiento.codigo || 'Sin código'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      movimiento.tipo === 'entrada' ? 'bg-green-100 text-green-800' :
                      movimiento.tipo === 'salida' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {movimiento.tipo === 'entrada' ? 'Entrada' :
                       movimiento.tipo === 'salida' ? 'Salida' : 'Transferencia'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatNumber(movimiento.cantidad)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{movimiento.sucursal_nombre || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{movimiento.usuario_nombre || '-'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MovimientosReport;