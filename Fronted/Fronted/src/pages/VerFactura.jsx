import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pedidoService } from '../services/pedidoService';
import facturaService from '../services/facturaService';
import authService from '../services/authService'; // <-- Importa el authService

const VerFactura = () => {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('id');
  
  // Estados
  const [factura, setFactura] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empresaData, setEmpresaData] = useState({
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    ciudad: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener datos del pedido
        const pedidoData = await pedidoService.getPedidoById(pedidoId);
        setPedido(pedidoData);

        // Obtener estado de factura
        const facturaData = await facturaService.verificarEstadoFactura(userId, pedidoId);
        if (facturaData.success) {
          setFactura(facturaData);

          // Obtener datos de la empresa desde authService
          const company = authService.getCompanyInfo();
          setEmpresaData({
            nombre: company.nombre_empresa || facturaData.empresa || 'Comercio',
            nit: company.nit_empresa || facturaData.nit || '13701877019',
            direccion: company.direccion || facturaData.direccion || 'Av. Principal #123',
            telefono: company.telefono_empresa || facturaData.telefono || '591-12345678',
            ciudad: company.municipio || facturaData.ciudad || 'La Paz, Bolivia'
          });
        } else {
          throw new Error(facturaData.error || 'No se pudo obtener la información de la factura');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Error al cargar los datos de la factura');
        setLoading(false);
      }
    };

    fetchData();
  }, [pedidoId, userId]);
  // Función para imprimir la factura
  const handlePrint = () => {
    window.print();
  };

  // Función utilitaria para formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date)) return fecha;
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg my-8 print:shadow-none">
      {/* Botones (solo visibles en pantalla, no al imprimir) */}
      <div className="mb-6 flex justify-between print:hidden">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          onClick={() => navigate(-1)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center"
          onClick={handlePrint}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Factura
        </button>
      </div>

      {/* Encabezado de la factura */}
      <div className="border-b-2 border-gray-300 pb-4 flex flex-wrap justify-between items-start">
        {/* Logo y datos de la empresa */}
        <div className="mb-4 md:mb-0 md:w-1/2">
          <h1 className="text-2xl font-bold text-gray-800">{empresaData.nombre}</h1>
          <p className="text-gray-600">{empresaData.direccion}</p>
          <p className="text-gray-600">{empresaData.ciudad}</p>
          <p className="text-gray-600">Tel: {empresaData.telefono}</p>
          <p className="text-gray-600">NIT: {empresaData.nit}</p>
        </div>
        
        {/* Datos de la factura */}
        <div className="md:w-1/2 md:text-right">
          <h2 className="text-xl font-bold text-gray-800 bg-gray-100 p-2 inline-block rounded">FACTURA</h2>
          <div className="mt-2">
            <p><strong>N° Factura:</strong> {factura?.codigo_recepcion || 'RECEP-9c12d9f3ca'}</p>
            <p><strong>Fecha Emisión:</strong> {formatearFecha(factura?.fecha_emision)}</p>
            <p><strong>Estado:</strong> <span className="text-green-600 font-semibold">{factura?.estado || 'Aceptado'}</span></p>
            <p><strong>CUF:</strong> {factura?.cuf || pedido?.cuf || 'No disponible'}</p>
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="my-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold text-gray-700 mb-2">DATOS DEL CLIENTE</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Nombre/Razón Social:</strong> {pedido?.cliente_nombre || factura?.cliente_nombre || 'S/N'}</p>
            <p><strong>NIT/CI:</strong> {pedido?.cliente_nit || factura?.cliente_nit || '0'}</p>
          </div>
          <div>
            <p><strong>Email:</strong> {pedido?.cliente_email || factura?.cliente_email || 'No especificado'}</p>
            <p><strong>Fecha de compra:</strong> {formatearFecha(pedido?.fecha)}</p>
          </div>
        </div>
      </div>

      {/* Detalle de productos */}
      <div className="my-6">
        <h3 className="font-bold text-gray-700 mb-2">DETALLE DE PRODUCTOS</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Producto</th>
              <th className="border p-2 text-center">Cantidad</th>
              <th className="border p-2 text-right">Precio Unitario</th>
              <th className="border p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido?.detalles && pedido.detalles.length > 0 ? (
              pedido.detalles.map((detalle, index) => {
                const nombre = typeof detalle.producto === 'object' 
                  ? detalle.producto.nombre 
                  : (detalle.nombre_producto || detalle.producto_nombre || detalle.producto || 'Producto sin nombre');
                
                const precioUnitario = Number(
                  detalle.precio_unitario || 
                  (typeof detalle.producto === 'object' ? detalle.producto.precio_venta : 0) ||
                  detalle.precio_venta ||
                  0
                );
                
                const subtotal = precioUnitario * detalle.cantidad;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border p-2">{nombre}</td>
                    <td className="border p-2 text-center">{detalle.cantidad}</td>
                    <td className="border p-2 text-right">Bs. {precioUnitario.toFixed(2)}</td>
                    <td className="border p-2 text-right">Bs. {subtotal.toFixed(2)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="border p-2 text-center text-gray-500">No hay productos disponibles</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan="3" className="border p-2 text-right">TOTAL:</td>
              <td className="border p-2 text-right bg-gray-100">Bs. {Number(pedido?.total || 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Detalles de pago */}
      <div className="my-6">
        <h3 className="font-bold text-gray-700 mb-2">MÉTODOS DE PAGO</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Tipo de Pago</th>
              <th className="border p-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pedido?.transacciones_formateadas && pedido.transacciones_formateadas.length > 0 ? (
              pedido.transacciones_formateadas.map((transaccion, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border p-2">{transaccion.nombre_tipo_pago}</td>
                  <td className="border p-2 text-right">{transaccion.monto_formateado || `Bs. ${Number(transaccion.monto).toFixed(2)}`}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="border p-2 text-center text-gray-500">No hay información de pago disponible</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      

      {/* Información de factura electrónica */}
      <div className="mt-8 border-t-2 border-gray-300 pt-4 text-sm">
        <p className="font-semibold mb-2">INFORMACIÓN IMPORTANTE:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>CUIS:</strong> {factura?.cuis || 'No disponible'}</p>
            <p><strong>Código de Recepción:</strong> {factura?.codigo_recepcion || 'No disponible'}</p>
          </div>
          <div>
            <p>Esta factura contribuye al desarrollo del país, el uso ilícito será sancionado penalmente de acuerdo a ley.</p>
          </div>
        </div>
      </div>

      {/* Mensaje final y códigos QR (simulados) */}
      <div className="mt-6 text-center border-t pt-4">
        <p className="text-sm text-gray-600 mb-4">¡GRACIAS POR SU COMPRA!</p>
        
        <div className="flex justify-center">
          {/* Código QR simulado - En un entorno real, se generaría con la información real de la factura */}
          <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-500">Código QR</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerFactura;