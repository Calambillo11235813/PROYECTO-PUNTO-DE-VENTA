import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pedidoService } from '../services/pedidoService';
import facturaService from '../services/facturaService';
import authService from '../services/authService';

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

  // Estados para el modal de anulación
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [anulacionError, setAnulacionError] = useState(null);
  const [anulacionExitosa, setAnulacionExitosa] = useState(false);

  // En la función useEffect donde se cargan los datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener datos del pedido
        const pedidoData = await pedidoService.getPedidoById(pedidoId);
        setPedido(pedidoData);

        // Obtener lista de facturas del usuario
        const facturasList = await facturaService.listarFacturasPorUsuario(userId);

        // Buscar la factura correspondiente al pedido actual
        const facturaEncontrada = facturasList?.facturas?.find(f => f.pedido_id === Number(pedidoId));
        if (facturaEncontrada) {
          // Respetar el estado_factura del pedido si está anulado
          if (pedidoData?.estado_factura === 'Anulado') {
            facturaEncontrada.estado = 'Anulado';
          }
          setFactura(facturaEncontrada);
        } else {
          throw new Error('No se encontró la factura para este pedido');
        }

        // Obtener datos de la empresa desde authService
        const company = authService.getCompanyInfo();
        setEmpresaData({
          nombre: company.nombre_empresa || facturasList.empresa?.razon_social || 'Comercio',
          nit: company.nit_empresa || facturasList.empresa?.nit || '13701877019',
          direccion: company.direccion || 'Av. Principal #123',
          telefono: company.telefono_empresa || '591-12345678',
          ciudad: company.municipio || 'La Paz, Bolivia'
        });

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

  // Función para abrir el modal de anulación
  const handleOpenAnularModal = () => {
    setShowAnularModal(true);
    setMotivoAnulacion('');
    setAnulacionError(null);
  };

  // Función para cerrar el modal de anulación
  const handleCloseAnularModal = () => {
    if (!anulando) {
      setShowAnularModal(false);
      setAnulacionError(null);
    }
  };

  // Función para anular la factura
  const handleAnularFactura = async () => {
    if (!motivoAnulacion || motivoAnulacion.trim().length < 5) {
      setAnulacionError('El motivo de anulación debe tener al menos 5 caracteres');
      return;
    }

    try {
      setAnulando(true);
      setAnulacionError(null);

      const resultado = await facturaService.anularFactura(userId, pedidoId, {
        motivo: motivoAnulacion
      });

      console.log('Resultado de anulación:', resultado);
      setAnulacionExitosa(true);
      
      // Actualizar el estado de la factura en el componente
      if (factura) {
        setFactura({
          ...factura,
          estado: 'Anulado'
        });
      }
      
      // Actualizar el estado del pedido en el componente
      if (pedido) {
        setPedido({
          ...pedido,
          estado_factura: 'Anulado'
        });
      }

      // Cerrar el modal después de un breve retraso
      setTimeout(() => {
        setShowAnularModal(false);
        setAnulando(false);
      }, 1500);
    } catch (err) {
      console.error('Error al anular factura:', err);
      setAnulacionError(err.error || err.message || 'Error al anular la factura');
      setAnulando(false);
    }
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
        <div className="flex space-x-2">
          {/* Botón para anular factura - solo visible si no está anulada */}
          {factura && factura.estado !== 'Anulado' && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
              onClick={handleOpenAnularModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Anular Factura
            </button>
          )}
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
      </div>

      {/* Si la factura está anulada, mostrar una etiqueta de estado */}
      {factura && factura.estado === 'Anulado' && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-bold">FACTURA ANULADA</span>
          </div>
        </div>
      )}

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
            <p><strong>N° Pedido:</strong> #{pedidoId}</p>
            <p><strong>Fecha Emisión:</strong> {formatearFecha(factura?.fecha_facturacion)}</p>
            <p><strong>Estado:</strong> 
              <span className={`font-semibold ${(factura?.estado === 'Anulado' || pedido?.estado_factura === 'Anulado') 
                ? 'text-red-600' 
                : 'text-green-600'}`}>
                {(factura?.estado === 'Anulado' || pedido?.estado_factura === 'Anulado') 
                  ? 'Anulado' 
                  : factura?.estado || 'Aceptado'}
              </span>
            </p>
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
          <div>
            <p>Esta factura contribuye al desarrollo del país, el uso ilícito será sancionado penalmente de acuerdo a ley.</p>
          </div>
      </div>

      {/* Mensaje final y códigos QR (simulados) */}
      <div className="mt-6 text-center border-t pt-4">
        <p className="text-sm text-gray-600 mb-4">¡GRACIAS POR SU COMPRA!</p>
      </div>

      {/* Modal de anulación de factura */}
      {showAnularModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Anular Factura #{pedidoId}</h3>
              <button 
                onClick={handleCloseAnularModal}
                disabled={anulando}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {anulacionExitosa ? (
              <div className="text-center py-4">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p className="mt-2 text-lg font-semibold text-gray-900">Factura anulada correctamente</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Esta acción anulará la factura en el sistema SIAT. Esta operación no se puede deshacer.
                </p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="motivo">
                    Motivo de anulación (obligatorio)
                  </label>
                  <textarea
                    id="motivo"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                    placeholder="Ingrese el motivo de anulación (mínimo 5 caracteres)"
                    rows={3}
                    disabled={anulando}
                  />
                </div>
                
                {anulacionError && (
                  <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-2">
                    <p>{anulacionError}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    onClick={handleCloseAnularModal}
                    disabled={anulando}
                  >
                    Cancelar
                  </button>
                  <button
                    className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center ${anulando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleAnularFactura}
                    disabled={anulando}
                  >
                    {anulando ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Anulando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Anular Factura
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerFactura;