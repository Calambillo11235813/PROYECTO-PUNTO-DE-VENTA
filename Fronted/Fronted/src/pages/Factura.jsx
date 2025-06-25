import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pedidoService } from '../services/pedidoService';
import facturaService from '../services/facturaService';

const Factura = () => {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('id');
  
  // Estados
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processingFactura, setProcessingFactura] = useState(false);
  const [searchingNit, setSearchingNit] = useState(false);
  
  // Datos del cliente para la factura
  const [clienteData, setClienteData] = useState({
    cliente_nit: '',
    cliente_nombre: '',
    cliente_email: ''
  });

  // Cargar datos del pedido
  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true);
        const data = await pedidoService.getPedidoById(pedidoId);
        setPedido(data);
        
        // Si el pedido ya tiene datos de cliente, cargarlos
        if (data.cliente_nit || data.cliente_nombre || data.cliente_email) {
          setClienteData({
            cliente_nit: data.cliente_nit || '',
            cliente_nombre: data.cliente_nombre || '',
            cliente_email: data.cliente_email || ''
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar el pedido:', err);
        setError('No se pudo cargar el pedido. ' + (err.error || err.message || 'Error desconocido'));
        setLoading(false);
      }
    };

    if (pedidoId) {
      fetchPedido();
    }
  }, [pedidoId]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClienteData(prev => ({ ...prev, [name]: value }));
  };

  // Buscar contribuyente por NIT
  const handleBuscarNIT = async () => {
    if (!clienteData.cliente_nit || clienteData.cliente_nit === '0') {
      setError('Ingrese un NIT válido para buscar');
      return;
    }
    
    try {
      setSearchingNit(true);
      setError(null);
      
      // Utilizar la API para buscar el contribuyente
      const response = await facturaService.buscarContribuyentePorNIT(
        userId, 
        clienteData.cliente_nit
      );
      
      if (response.success && response.datos) {
        // Actualizar el nombre con el dato obtenido
        setClienteData(prev => ({ 
          ...prev, 
          cliente_nombre: response.datos.razonSocial || response.datos.nombreContribuyente || prev.cliente_nombre,
          cliente_email: response.datos.email || prev.cliente_email
        }));
        setSuccess(`Contribuyente encontrado: ${response.datos.razonSocial || response.datos.nombreContribuyente}`);
      } else {
        setError(response.error || 'NIT no encontrado en el padrón de contribuyentes');
      }
    } catch (err) {
      console.error('Error al buscar NIT:', err);
      setError('Error al buscar contribuyente: ' + (err.error || err.message || 'Error desconocido'));
    } finally {
      setSearchingNit(false);
    }
  };

  // Emitir factura
  const handleEmitirFactura = async () => {
    try {
      setProcessingFactura(true);
      setError(null);
      setSuccess(null);
      
      // Validar datos mínimos
      if (clienteData.cliente_nit === '' && clienteData.cliente_nombre === '') {
        setError('Ingrese al menos el NIT o el nombre del cliente');
        setProcessingFactura(false);
        return;
      }
      
      // Enviar solicitud de facturación
      const resultado = await facturaService.facturarPedido(
        userId, 
        pedidoId, 
        clienteData
      );
      
      if (resultado.success) {
        // Actualizar el estado del pedido a "facturado"
        try {
          const estadoActualizado = await pedidoService.updatePedidoFacturado(pedidoId);
          console.log('✅ Estado de pedido actualizado a facturado:', estadoActualizado);
        } catch (updateError) {
          console.warn('No se pudo actualizar el estado del pedido como facturado:', updateError);
        }
        
        // Mostrar mensaje de éxito
        setSuccess('Factura emitida correctamente. CUF: ' + resultado.cuf);
        
        // Actualizar el pedido con la nueva información
        const pedidoActualizado = await pedidoService.getPedidoById(pedidoId);
        setPedido(pedidoActualizado);
        
        // Esperar un momento para que el usuario vea el mensaje de éxito
        // y luego redirigir automáticamente
        setTimeout(() => {
          // Marcar que estamos regresando de la pantalla de facturación
          sessionStorage.setItem('returnedFromFactura', 'true');
          sessionStorage.setItem('lastFacturedPedidoId', pedidoId);
          sessionStorage.setItem('facturacionExitosa', 'true');
          navigate(-1);
        }, 2500); // Esperar 2.5 segundos antes de redirigir
      } else {
        setError(resultado.error || 'Error al emitir la factura');
      }
    } catch (err) {
      console.error('Error al emitir factura:', err);
      setError('Error al procesar la factura: ' + (err.error || err.message || 'Error desconocido'));
    } finally {
      setProcessingFactura(false);
    }
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center mt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si hay error al cargar el pedido
  if (error && !pedido) {
    return (
      <div className="m-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate(-1)}
        >
          Regresar
        </button>
      </div>
    );
  }

  // Añadir este código al botón "Volver" o en cualquier función que regrese al historial
  const handleGoBack = () => {
    // Marcar que estamos regresando de la pantalla de facturación
    sessionStorage.setItem('returnedFromFactura', 'true');
    navigate(-1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 className="text-2xl font-bold">Facturación de Pedido #{pedidoId}</h1>
      </div>
      
      {pedido?.facturado && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          Este pedido ya ha sido facturado ({pedido.estado_factura || 'EMITIDO'})
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}
      
      {/* Detalles del pedido */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalles del Pedido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Total:</strong> Bs. {pedido?.total.toFixed(2)}</p>
            <p><strong>Fecha:</strong> {new Date(pedido?.fecha).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> {pedido?.estado?.descripcion || 'No especificado'}</p>
          </div>
          
          <div>
            <p><strong>Tipo Venta:</strong> {pedido?.tipo_venta?.descripcion || 'No especificado'}</p>
            <p><strong>Facturado:</strong> {pedido?.facturado ? 'Sí' : 'No'}</p>
            {pedido?.facturado && (
              <>
                <p><strong>CUF:</strong> {pedido?.cuf}</p>
                <p><strong>Estado Factura:</strong> {pedido?.estado_factura || 'EMITIDA'}</p>
              </>
            )}
          </div>
        </div>
        
        <hr className="my-4" />
        
        <h3 className="font-semibold mb-2">Productos:</h3>
        
        {pedido?.detalles && pedido.detalles.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {pedido.detalles.map((detalle, index) => (
              <div key={index} className="border border-gray-200 rounded p-3 mb-2 flex justify-between">
                <div>
                  <span className="font-medium">
                    {/* Determinar el nombre del producto según la estructura de datos */}
                    {typeof detalle.producto === 'object' 
                      ? detalle.producto.nombre 
                      : typeof detalle === 'object' && detalle.nombre_producto 
                        ? detalle.nombre_producto
                        : typeof detalle === 'object' && detalle.producto_nombre
                          ? detalle.producto_nombre
                          : detalle.producto || 'Producto sin nombre'}
                  </span>
                  <span className="text-gray-500 ml-2">x {detalle.cantidad}</span>
                </div>
                <div className="text-right">
                  {/* Mostrar el precio unitario utilizando cualquier propiedad disponible */}
                  <span>
                    Bs. {Number(
                      detalle.precio_unitario || 
                      (typeof detalle.producto === 'object' ? detalle.producto.precio_venta || detalle.producto.precio : 0) ||
                      detalle.precio_venta ||
                      0
                    ).toFixed(2)} c/u
                  </span>
                  <div className="text-sm text-gray-500">
                    {/* Mostrar el subtotal */}
                    Total: Bs. {Number(
                      ((detalle.precio_unitario || 
                      (typeof detalle.producto === 'object' ? detalle.producto.precio_venta || detalle.producto.precio : 0) ||
                      detalle.precio_venta ||
                      0) 
                      * detalle.cantidad)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay detalles disponibles</p>
        )}
      </div>
      
      {/* Formulario de Facturación */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Datos para Facturación</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIT/CI del Cliente
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="cliente_nit"
                  value={clienteData.cliente_nit}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                  placeholder="NIT o CI"
                />
                <button
                  onClick={handleBuscarNIT}
                  disabled={searchingNit || !clienteData.cliente_nit}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {searchingNit ? (
                    <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">Ingrese 0 para facturar sin NIT</p>
            </div>
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre/Razón Social
            </label>
            <input
              type="text"
              name="cliente_nombre"
              value={clienteData.cliente_nombre}
              onChange={handleInputChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Razón social o nombre del cliente"
            />
            <p className="mt-1 text-sm text-gray-500">Razón social o nombre del cliente</p>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del Cliente (opcional)
            </label>
            <input
              type="email"
              name="cliente_email"
              value={clienteData.cliente_email}
              onChange={handleInputChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Email (opcional)"
            />
            <p className="mt-1 text-sm text-gray-500">Para envío de factura (opcional)</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button 
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          
          <button
            className={`py-2 px-4 rounded-md shadow-sm text-sm font-medium ${
              processingFactura || pedido?.facturado 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleEmitirFactura}
            disabled={processingFactura || pedido?.facturado}
          >
            {pedido?.facturado ? 'Ya Facturado' : (processingFactura ? 'Procesando...' : 'Emitir Factura')}
          </button>
        </div>
      </div>

      {/* Sección para verificar estado de factura (si ya está facturado) */}
      {pedido?.facturado && (
        <div className="mt-4 text-center">
          <button 
            className="py-2 px-4 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
            onClick={async () => {
              try {
                setLoading(true);
                const estadoFactura = await facturaService.verificarEstadoFactura(userId, pedidoId);
                if (estadoFactura.success) {
                  setSuccess(`Estado actual de la factura: ${estadoFactura.estado}`);
                  
                  // Actualizar el pedido con la nueva información
                  const pedidoActualizado = await pedidoService.getPedidoById(pedidoId);
                  setPedido(pedidoActualizado);
                } else {
                  setError(estadoFactura.error || 'No se pudo verificar el estado de la factura');
                }
              } catch (err) {
                console.error('Error al verificar estado:', err);
                setError('Error al verificar estado: ' + (err.error || err.message));
              } finally {
                setLoading(false);
              }
            }}
          >
            Verificar Estado de Factura
          </button>
        </div>
      )}
    </div>
  );
};

export default Factura;