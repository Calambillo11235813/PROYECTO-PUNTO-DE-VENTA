import React from 'react';
import ReportEmpty from '../ReportEmpty';
import { FaUser, FaShoppingBag, FaDollarSign } from 'react-icons/fa';

const ClientesReport = ({ reportData }) => {
  if (!reportData || !reportData.clientes || reportData.clientes.length === 0) {
    return (
      <ReportEmpty
        title="No hay datos de clientes disponibles"
        message="No se encontraron registros de clientes para el período especificado."
      />
    );
  }

  // Calcular estadísticas si existen
  const totalClientes = reportData.clientes.length;
  const clientesActivos = reportData.clientes.filter(c => c.activo).length;
  const totalGastado = reportData.clientes.reduce((sum, c) => sum + (c.total_compras || 0), 0);
  const compraPromedio = totalClientes > 0 ? totalGastado / totalClientes : 0;

  return (
    <div className="overflow-x-auto">
      {/* Panel de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaUser className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de clientes</p>
            <p className="text-xl font-semibold">{totalClientes}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaShoppingBag className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Clientes activos</p>
            <p className="text-xl font-semibold">{clientesActivos}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FaDollarSign className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Compra promedio</p>
            <p className="text-xl font-semibold">${compraPromedio.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Listado de clientes */}
      <div className="p-4 mb-4 rounded-md" style={{ backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-semibold text-gray-800">Lista de Clientes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compras
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.clientes.map((cliente, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{cliente.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{cliente.telefono || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{cliente.num_compras || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${(cliente.total_compras || 0).toFixed(2)}</div>
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

export default ClientesReport;