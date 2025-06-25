import React from 'react';
import { FaChartBar } from 'react-icons/fa';
import ReportEmpty from '../ReportEmpty';

const VentasReport = ({ reportData, reportSubType }) => {
  console.log("Renderizando reporte de ventas:", reportData);
  
  if (!reportData) {
    return (
      <ReportEmpty
        title="No hay datos disponibles"
        message="Selecciona un rango de fechas y haz clic en 'Generar Reporte' para ver las ventas."
      />
    );
  }
  
  if (reportData.message && reportData.message.includes('No se encontraron')) {
    return (
      <ReportEmpty
        title="No hay ventas disponibles"
        message="No se encontraron ventas para el período especificado."
      />
    );
  }
  
  if (reportSubType === 'general') {
    return <VentasGeneralReport reportData={reportData} />;
  } else if (reportSubType === 'productos') {
    return <VentasProductosReport reportData={reportData} />;
  }
  
  return (
    <ReportEmpty
      title="Subtipo de reporte no reconocido"
      message={`El subtipo "${reportSubType}" no está implementado aún.`}
    />
  );
};

const VentasGeneralReport = ({ reportData }) => {
  if (!reportData.ventas || reportData.ventas.length === 0) {
    return (
      <ReportEmpty
        title="No hay ventas registradas"
        message="No se encontraron ventas para el período especificado."
      />
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="p-4 mb-4 rounded-md" style={{ backgroundColor: "var(--bg-report-section)" }}>
        <h4 className="font-medium text-lg mb-2">Resumen de Ventas</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-md border">
            <p className="text-gray-500 text-sm">Total Ventas</p>
            <p className="text-2xl font-bold">{reportData.resumen?.total_ventas_bs?.toFixed(2) || '0.00'} Bs</p>
          </div>
          <div className="bg-white p-3 rounded-md border">
            <p className="text-gray-500 text-sm">Cantidad de Ventas</p>
            <p className="text-2xl font-bold">{reportData.resumen?.cantidad_ventas || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-md border">
            <p className="text-gray-500 text-sm">Promedio por Venta</p>
            <p className="text-2xl font-bold">{reportData.resumen?.promedio_venta?.toFixed(2) || '0.00'} Bs</p>
          </div>
          <div className="bg-white p-3 rounded-md border">
            <p className="text-gray-500 text-sm">Items Vendidos</p>
            <p className="text-2xl font-bold">{reportData.resumen?.total_items_vendidos || 0}</p>
          </div>
        </div>
        
        {reportData.resumen?.ventas_por_metodo_pago && (
          <div className="mt-4">
            <h5 className="font-medium mb-2">Ventas por Método de Pago</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(reportData.resumen.ventas_por_metodo_pago).map(([metodo, monto]) => (
                <div key={metodo} className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-500">{metodo}</p>
                  <p className="font-medium">{parseFloat(monto).toFixed(2)} Bs</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead style={{ backgroundColor: "var(--bg-report-section)" }}>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.ventas.map((venta) => (
            <tr key={venta.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.fecha}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cliente}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.estado}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cantidad_items}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{venta.total.toFixed(2)} Bs</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {venta.metodos_pago?.map((metodo, idx) => (
                  <span key={idx} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs mr-1">
                    {metodo.tipo}: {metodo.monto.toFixed(2)} Bs
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ backgroundColor: "var(--bg-report-section)" }}>
          <tr>
            <td colSpan="5" className="px-6 py-4 text-right text-sm font-medium">Total:</td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900">{reportData.resumen?.total_ventas_bs?.toFixed(2) || '0.00'} Bs</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const VentasProductosReport = ({ reportData }) => {
  if (!reportData.productos || reportData.productos.length === 0) {
    return (
      <ReportEmpty
        title="No hay productos vendidos"
        message="No se encontraron productos vendidos para el período especificado."
      />
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="p-4 mb-4 rounded-md" style={{ backgroundColor: "var(--bg-report-section)" }}>
        <h4 className="font-medium text-lg mb-2">Ventas por Productos</h4>
        <p>Total productos vendidos: {reportData.total_productos_vendidos || reportData.productos.length}</p>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead style={{ backgroundColor: "var(--bg-report-section)" }}>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Vendida</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ventas</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.productos.map((producto) => (
            <tr key={producto.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{producto.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.nombre}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.cantidad_vendida}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.precio_promedio?.toFixed(2) || '0.00'} Bs</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{producto.ventas_total?.toFixed(2) || '0.00'} Bs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VentasReport;