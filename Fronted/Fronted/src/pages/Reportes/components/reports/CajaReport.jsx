import React from 'react';
import ReportEmpty from '../ReportEmpty';
import { FaMoneyBillAlt, FaCashRegister, FaCalendarAlt } from 'react-icons/fa';

const CajaReport = ({ reportData }) => {
  if (!reportData || !reportData.cajas || reportData.cajas.length === 0) {
    return (
      <ReportEmpty
        title="No hay datos de caja disponibles"
        message="No se encontraron registros de caja para el período especificado."
      />
    );
  }

  // Formatear cantidades de dinero
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0.00';
    return typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2);
  };

  // Calcular totales si están disponibles
  const totalInicial = reportData.total_general?.monto_inicial_total || 0;
  const totalFinal = reportData.total_general?.monto_final_total || 0;
  const totalEfectivo = reportData.total_general?.total_efectivo || 0;
  const totalQR = reportData.total_general?.total_qr || 0;
  const totalTarjeta = reportData.total_general?.total_tarjeta || 0;

  return (
    <div className="overflow-x-auto p-4">
      {/* Panel de resumen */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Cajas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-2 mr-3">
                <FaCashRegister className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cajas</p>
                <p className="text-xl font-semibold">{reportData.total_cajas || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 mr-3">
                <FaMoneyBillAlt className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Efectivo</p>
                <p className="text-xl font-semibold">{formatCurrency(totalEfectivo)} Bs</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-2 mr-3">
                <FaCalendarAlt className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Periodo</p>
                <p className="text-sm font-medium">
                  {reportData.fecha_inicio || 'N/A'} a {reportData.fecha_fin || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resumen por métodos de pago */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Distribución por Método de Pago</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Efectivo</p>
              <p className="text-lg font-medium">{formatCurrency(totalEfectivo)} Bs</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">QR / Transferencia</p>
              <p className="text-lg font-medium">{formatCurrency(totalQR)} Bs</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Tarjeta</p>
              <p className="text-lg font-medium">{formatCurrency(totalTarjeta)} Bs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de cajas */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apertura
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cierre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Inicial
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Final
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efectivo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                QR / Transfer.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarjeta
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.cajas.map((caja) => (
              <tr key={caja.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {caja.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {caja.fecha_apertura}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {caja.fecha_cierre || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {caja.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(caja.monto_inicial)} Bs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(caja.monto_final)} Bs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(caja.total_efectivo)} Bs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(caja.total_qr)} Bs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(caja.total_tarjeta)} Bs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CajaReport;