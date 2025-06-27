import React, { useState, useEffect } from 'react';
import facturaService from '../services/facturaService';
import { pedidoService } from '../services/pedidoService';
import { toast } from 'react-toastify';
import { FaFileInvoiceDollar, FaSearch, FaEye, FaTimes, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Lista_facturas = () => {
  const [facturas, setFacturas] = useState([]);
  const [filteredFacturas, setFilteredFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFacturas();
  }, [refreshKey]);

  useEffect(() => {
    if (facturas.length > 0) {
      applyFilters();
    }
  }, [searchTerm, dateFilter, facturas]);

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const id = localStorage.getItem('id');
      const response = await facturaService.listarFacturasPorUsuario(id);
      
      // Registrar los datos recibidos para depuración
      console.log('Datos recibidos de la API:', response);
      
      // Si la respuesta es un objeto con propiedad facturas, usarla
      // De lo contrario, usar directamente la respuesta
      let facturasData = Array.isArray(response) ? response : 
                         response && response.facturas ? response.facturas :
                         [];
      
      // Adaptar el formato de los datos si es necesario
      facturasData = facturasData.map(factura => {
        // Asegurarnos de que cada factura tenga los campos necesarios
        return {
          id: factura.id || factura.pedido_id,
          numero_factura: factura.pedido_id || factura.id || 'N/A',
          fecha_emision: factura.fecha_facturacion || factura.fecha || new Date().toISOString(),
          cliente_nombre: factura.cliente_nombre || factura.razon_social || 'Cliente general',
          cliente_nit: factura.cliente_nit || factura.nit || '0',
          cliente_email: factura.cliente_email || factura.email || '',
          monto_total: factura.monto_total || factura.total || 0,
          monto_subtotal: factura.monto_subtotal || factura.subtotal || 0,
          monto_descuento: factura.monto_descuento || factura.descuento || 0,
          estado: factura.estado || 'Aceptado',
          pedido_id: factura.pedido_id || factura.id,
          cuf: factura.cuf || '',
          pdf_url: factura.pdf_url || null,
          items: factura.items || [],
          motivo_anulacion: factura.motivo_anulacion || ''
        };
      });
      
      console.log('Facturas procesadas:', facturasData);
      
      setFacturas(facturasData);
      setFilteredFacturas(facturasData);
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      toast.error('No se pudieron cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...facturas];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (factura) =>
          factura.id.toString().includes(searchTerm) ||
          factura.cuf?.includes(searchTerm) ||
          (factura.cliente_nombre && factura.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (factura.cliente_nit && factura.cliente_nit.includes(searchTerm))
      );
    }

    // Filtrar por rango de fechas
    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59); // Incluir todo el día final

      filtered = filtered.filter((factura) => {
        const facturaDate = new Date(factura.fecha_emision);
        return facturaDate >= startDate && facturaDate <= endDate;
      });
    }

    setFilteredFacturas(filtered);
  };

  const handleViewFactura = async (factura) => {
    try {
      // Obtener detalles completos del pedido desde el pedidoService
      const pedidoCompleto = await pedidoService.getPedidoById(factura.pedido_id);
      
      // Combinar los datos de factura con los datos completos del pedido
      setSelectedFactura({
        ...factura,
        detalles: pedidoCompleto.detalles || [],
        transacciones_formateadas: pedidoCompleto.transacciones_formateadas || [],
        // Conservar otros datos importantes del pedido que puedan faltar en la factura
        cliente_nombre: factura.cliente_nombre || pedidoCompleto.cliente_nombre,
        cliente_nit: factura.cliente_nit || pedidoCompleto.cliente_nit,
        cliente_email: factura.cliente_email || pedidoCompleto.cliente_email,
        total_pagos: pedidoCompleto.total_pagos,
        pagado_completo: pedidoCompleto.pagado_completo
      });
      
      setShowModal(true);
    } catch (error) {
      console.error('Error al obtener detalles completos:', error);
      toast.error('No se pudieron cargar los detalles completos');
      // Si falla, mostrar los datos básicos de la factura
      setSelectedFactura(factura);
      setShowModal(true);
    }
  };

  const handleAnularFactura = (factura) => {
    setSelectedFactura(factura);
    setMotivoAnulacion('');
    setShowAnularModal(true);
  };

  const confirmarAnulacion = async () => {
    if (motivoAnulacion.trim().length < 5) {
      toast.error('El motivo de anulación debe tener al menos 5 caracteres');
      return;
    }

    setAnulando(true);
    try {
      const userId = localStorage.getItem('id');
      await facturaService.anularFactura(userId, selectedFactura.pedido_id, { motivo: motivoAnulacion });
      toast.success('Factura anulada correctamente');
      setShowAnularModal(false);
      setRefreshKey(oldKey => oldKey + 1);
    } catch (error) {
      console.error('Error al anular factura:', error);
      toast.error('No se pudo anular la factura: ' + (error.error || 'Error desconocido'));
    } finally {
      setAnulando(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    
    try {
      // Si la fecha viene en formato YYYY-MM-DD sin hora
      if (dateString.length === 10 && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Para fechas con formato completo
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error("Formato de fecha inválido:", dateString);
        return "Fecha inválida";
      }
      
      // Formatea la fecha para mostrar en formato local
      return date.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      console.error("Error al formatear fecha:", e, dateString);
      return "Error de formato";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  const getEstadoLabel = (estado) => {
    const estados = {
      'Aceptado': { 
        text: 'Aceptado', 
        color: 'bg-green-100 text-green-800' 
      },
      'Anulado': { 
        text: 'Anulado', 
        color: 'bg-red-100 text-red-800' 
      },
      'Pendiente': { 
        text: 'Pendiente', 
        color: 'bg-yellow-100 text-yellow-800' 
      },
      'Rechazado': { 
        text: 'Rechazado', 
        color: 'bg-red-100 text-red-800' 
      }
    };
    
    return estados[estado] || { text: estado || 'Desconocido', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold title-icon flex items-center mb-2">
          <FaFileInvoiceDollar className="mr-2 icon-accent" />
          Lista de facturas
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona todas las facturas emitidas en el sistema
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por NIT, cliente o CUF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter({ startDate: '', endDate: '' });
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-600">Cargando facturas...</span>
          </div>
        ) : filteredFacturas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha emisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFacturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {factura.numero_factura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(factura.fecha_emision)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.cliente_nombre || 'Cliente general'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.cliente_nit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(factura.monto_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoLabel(factura.estado).color}`}>
                        {getEstadoLabel(factura.estado).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewFactura(factura)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                        {factura.estado === 'Aceptado' && (
                          <button
                            onClick={() => handleAnularFactura(factura)}
                            className="text-red-600 hover:text-red-900"
                            title="Anular factura"
                          >
                            <FaTimes />
                          </button>
                        )}
                        {factura.pdf_url && (
                          <a
                            href={factura.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                            title="Descargar PDF"
                          >
                            <FaFilePdf />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10">
            <FaFileInvoiceDollar className="mx-auto h-12 w-12 icon-accent" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron facturas que coincidan con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedFactura && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:w-full">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Detalle de la factura - Factura #{selectedFactura.numero_factura}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowModal(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="bg-white p-6">
                {/* Estado de anulación (si aplica) */}
                {selectedFactura.estado === 'Anulado' && (
                  <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="w-6 h-6 mr-2" />
                      <span className="font-bold">FACTURA ANULADA</span>
                    </div>
                    {selectedFactura.motivo_anulacion && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Motivo:</span> {selectedFactura.motivo_anulacion}
                      </p>
                    )}
                  </div>
                )}

                {/* Encabezado con datos de factura y cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Información de factura */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">INFORMACIÓN DE LA FACTURA</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">N° Pedido:</span>
                        <span className="ml-2 text-gray-800">
                          #{selectedFactura.pedido_id}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">N° Factura:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedFactura.numero_factura || selectedFactura.codigo_recepcion || 'N/A'}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Fecha:</span>
                        <span className="ml-2 text-gray-800">
                          {formatDate(selectedFactura.fecha_emision)}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Estado:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getEstadoLabel(selectedFactura.estado).color}`}>
                          {getEstadoLabel(selectedFactura.estado).text}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">DATOS DEL CLIENTE</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Nombre/Razón Social:</span>
                        <span className="ml-2 text-gray-800">{selectedFactura.cliente_nombre || 'Cliente general'}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">NIT/CI:</span>
                        <span className="ml-2 text-gray-800">{selectedFactura.cliente_nit || '-'}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="ml-2 text-gray-800">{selectedFactura.cliente_email || '-'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles de productos */}
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">DETALLE DE PRODUCTOS</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Precio Unitario
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedFactura.items && selectedFactura.items.length > 0 ? (
                          selectedFactura.items.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {item.descripcion || "Producto sin nombre"}
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">
                                {item.cantidad || 0}
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-gray-500">
                                {formatCurrency(item.precio_unitario || 0)}
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-gray-500">
                                {formatCurrency(item.subtotal || 0)}
                              </td>
                            </tr>
                          ))
                        ) : selectedFactura.detalles && selectedFactura.detalles.length > 0 ? (
                          selectedFactura.detalles.map((detalle, index) => {
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
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{nombre}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-500">{detalle.cantidad}</td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                  {formatCurrency(precioUnitario)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                  {formatCurrency(subtotal)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-yellow-700">
                              <div className="flex justify-center items-center">
                                <FaExclamationTriangle className="mr-2" />
                                No se encontraron detalles de productos para esta factura
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Métodos de pago - Sólo mostrar si hay transacciones disponibles */}
                {selectedFactura.transacciones_formateadas && selectedFactura.transacciones_formateadas.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">MÉTODOS DE PAGO</h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Tipo de Pago
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Monto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedFactura.transacciones_formateadas.map((transaccion, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {transaccion.nombre_tipo_pago}
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-gray-500">
                                {transaccion.monto_formateado || formatCurrency(transaccion.monto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Resumen financiero */}
                <div className="mt-6 bg-gray-50 p-4 rounded-md">

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(selectedFactura.monto_total || 0)}
                    </span>
                  </div>
                </div>

                {/* Mensaje de factura electrónica */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                  <p className="text-center">Esta factura contribuye al desarrollo del país, el uso ilícito será sancionado penalmente de acuerdo a ley.</p>
                  <p className="text-center mt-2 font-medium">¡GRACIAS POR SU COMPRA!</p>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedFactura.pdf_url && (
                  <a
                    href={selectedFactura.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <FaFilePdf className="mr-2" /> Descargar PDF
                  </a>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anulación */}
      {showAnularModal && selectedFactura && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => !anulando && setShowAnularModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Anular Factura #{selectedFactura.numero_factura}
                </h3>
                {!anulando && (
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAnularModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="bg-white p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-red-100 rounded-full p-3">
                      <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-gray-700">
                    Está a punto de anular la factura #{selectedFactura.numero_factura}. 
                    Esta acción no se puede deshacer y será reportada a Impuestos Nacionales.
                  </p>
                </div>

                <div className="mt-4">
                  <label htmlFor="motivoAnulacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de anulación (requerido)
                  </label>
                  <textarea
                    id="motivoAnulacion"
                    name="motivoAnulacion"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                    disabled={anulando}
                    placeholder="Ingrese el motivo de la anulación (mínimo 5 caracteres)"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmarAnulacion}
                  disabled={anulando || motivoAnulacion.trim().length < 5}
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
                    'Confirmar anulación'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAnularModal(false)}
                  disabled={anulando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lista_facturas;