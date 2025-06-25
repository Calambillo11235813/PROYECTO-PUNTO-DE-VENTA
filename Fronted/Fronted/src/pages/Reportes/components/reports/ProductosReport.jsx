import React from 'react';
import ReportEmpty from '../ReportEmpty';
import { FaBox, FaTags, FaWarehouse } from 'react-icons/fa';

const ProductosReport = ({ reportData, reportSubType }) => {
  const sucursalActualId = localStorage.getItem('sucursal_actual_id');
  const sucursalActualNombre = localStorage.getItem('sucursal_actual_nombre');
  
  // Verificar si hay datos válidos
  if (!reportData || !reportData.productos || reportData.productos.length === 0) {
    return (
      <ReportEmpty
        title="No hay productos disponibles"
        message={`No se encontraron productos${sucursalActualNombre ? ` en ${sucursalActualNombre}` : ''} para el período especificado.`}
      />
    );
  }
  
  // Si llegamos aquí, hay productos para mostrar
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">
          Reporte de Inventario {reportData.categoria_filtro && `- ${reportData.categoria_filtro}`}
        </h2>
        <p className="text-sm text-gray-500">
          Generado: {new Date(reportData.fecha_generacion).toLocaleString()}
          {sucursalActualNombre && ` - Sucursal: ${sucursalActualNombre}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaBox className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total productos</p>
            <p className="text-xl font-semibold">{reportData.total_productos}</p>
          </div>
        </div>
        {/* Otros indicadores según necesites */}
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                    {producto.codigo && <div className="text-xs text-gray-500">{producto.codigo}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${typeof producto.precio_compra === 'number' ? producto.precio_compra.toFixed(2) : producto.precio_compra}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${typeof producto.precio_venta === 'number' ? producto.precio_venta.toFixed(2) : producto.precio_venta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {producto.stock_actual || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {producto.categoria?.nombre || 'Sin categoría'}
                    </span>
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

export default ProductosReport;