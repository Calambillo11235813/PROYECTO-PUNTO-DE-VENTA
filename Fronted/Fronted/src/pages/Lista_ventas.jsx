import React, { useState, useEffect } from 'react';
import { pedidoService } from '../services/pedidoService';
import { toast } from 'react-toastify';
import { FaShoppingBag, FaSearch, FaEye, FaTrash, FaFileInvoice } from 'react-icons/fa';

const Lista_ventas = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchPedidos();
  }, [refreshKey]);

  useEffect(() => {
    if (pedidos.length > 0) {
      applyFilters();
    }
  }, [searchTerm, dateFilter, pedidos]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const data = await pedidoService.getAllPedidos();
      setPedidos(data);
      setFilteredPedidos(data);
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      toast.error('No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pedidos];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (pedido) =>
          pedido.id.toString().includes(searchTerm) ||
          (pedido.cliente && pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por rango de fechas
    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59); // Incluir todo el día final

      filtered = filtered.filter((pedido) => {
        const pedidoDate = new Date(pedido.fecha_creacion);
        return pedidoDate >= startDate && pedidoDate <= endDate;
      });
    }

    setFilteredPedidos(filtered);
  };

  const handleViewPedido = async (pedidoId) => {
    try {
      setLoading(true);
      const detallePedido = await pedidoService.getPedidoById(pedidoId);
      setSelectedPedido(detallePedido);
      setShowModal(true);
    } catch (error) {
      console.error('Error al obtener detalles de la venta:', error);
      toast.error('No se pudieron cargar los detalles de la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePedido = async (pedidoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      return;
    }

    try {
      await pedidoService.deletePedido(pedidoId);
      toast.success('Venta eliminada correctamente');
      setRefreshKey(oldKey => oldKey + 1);
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      toast.error('No se pudo eliminar la venta');
    }
  };

  // Mejora la función formatDate para manejar diversos formatos de fecha
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
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold title-icon flex items-center mb-2">
          <FaShoppingBag className="mr-2 icon-accent" />
          Lista de ventas
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona todas las ventas realizadas en el sistema
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div style={{ backgroundColor: "var(--bg-tertiary)" }}className=" rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID o cliente..."
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

      {/* Tabla de Ventas */}
      <div style={{ backgroundColor: "var(--bg-tertiary)" }}className=" rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-600">Cargando ventas...</span>
          </div>
        ) : filteredPedidos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{pedido.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pedido.fecha || pedido.fecha_creacion || pedido.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.cliente || 'Cliente general'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(pedido.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewPedido(pedido.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDeletePedido(pedido.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar venta"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10">
            <FaShoppingBag className="mx-auto h-12 w-12 icon-accent" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron ventas que coincidan con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedPedido && (
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
                  Detalle de la venta #{selectedPedido.id}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">INFORMACIÓN GENERAL</h4>
                    <p className="mt-2 flex items-center">
                      <span className="font-medium text-gray-600">Fecha:</span>
                      <span className="ml-2 text-gray-800">
                        {formatDate(selectedPedido.fecha || selectedPedido.fecha_creacion || selectedPedido.created_at)}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center">
                      <span className="font-medium text-gray-600">Cliente:</span>
                      <span className="ml-2 text-gray-800">{selectedPedido.cliente || 'Cliente general'}</span>
                    </p>
                    <p className="mt-1 flex items-center">
                      <span className="font-medium text-gray-600">Tipo de venta:</span>
                      <span className="ml-2 text-gray-800">
                        {selectedPedido.tipo_venta_nombre || 'Venta directa'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">DETALLES DE PRODUCTOS</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unitario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPedido.detalles && selectedPedido.detalles.map((detalle, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {detalle.producto_nombre || "Producto sin nombre"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {detalle.cantidad || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(detalle.precio_unitario || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency((detalle.subtotal) || (detalle.cantidad * detalle.precio_unitario) || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-800">
                      {formatCurrency(selectedPedido.subtotal || selectedPedido.total * 0.84 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-gray-600">IVA (16%):</span>
                    <span className="text-sm text-gray-800">
                      {formatCurrency(selectedPedido.impuestos || selectedPedido.total * 0.16 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(selectedPedido.total_con_impuestos || selectedPedido.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
    </div>
  );
};

export default Lista_ventas;