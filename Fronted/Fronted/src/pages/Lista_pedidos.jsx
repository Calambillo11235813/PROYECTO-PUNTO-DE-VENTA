import React, { useEffect, useState } from "react";
import pedidoProveedorService from "../services/pedidoProveedorService";
import sucursalService from "../services/SucursalService";
import { FaStore, FaClipboardList, FaBoxOpen, FaUser, FaCalendarAlt, FaListUl, FaMoneyBillWave, FaSearch } from "react-icons/fa";

const Lista_pedidos = () => {
  const usuarioId = localStorage.getItem("id");
  const [sucursales, setSucursales] = useState([]);
  const [pedidosPorSucursal, setPedidosPorSucursal] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [editingEstadoId, setEditingEstadoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado

  // Cargar sucursales al montar
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const sucursalesData = await sucursalService.getSucursalesByUsuario(usuarioId);
        setSucursales(sucursalesData);
        if (sucursalesData.length > 0) setActiveTab(sucursalesData[0].id);
      } catch {
        setSucursales([]);
      }
    };
    fetchSucursales();
  }, [usuarioId]);

  // Cargar pedidos por sucursal
  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const allPedidos = await Promise.all(
          sucursales.map(async (suc) => {
            const pedidos = await pedidoProveedorService.getPedidosPorUsuarioYSucursal(usuarioId, suc.id);
            return {
              sucursalId: suc.id,
              sucursalNombre: suc.nombre,
              pedidos: pedidos // Ahora cada pedido tiene detalles
            };
          })
        );
        setPedidosPorSucursal(allPedidos);
      } catch {
        setPedidosPorSucursal([]);
      }
      setLoading(false);
    };
    if (sucursales.length > 0) fetchPedidos();
  }, [sucursales, usuarioId]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      if (dateString.length === 10 && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString('es-ES');
    } catch {
      return "Error de formato";
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(Number(amount) || 0);
  };

  // Calcular subtotal
  const getSubtotal = (pedido) => {
    if (!pedido || !pedido.detalles) return 0;
    return pedido.detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
  };

  // Actualizar estado del pedido
  const handleUpdateEstado = async (pedidoId, nuevoEstado) => {
    await pedidoProveedorService.actualizarEstadoPedido(pedidoId, nuevoEstado);
    setEditingEstadoId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <FaClipboardList className="text-green-600" /> Lista de Pedidos por Sucursal
        </h1>

        {/* Tabs de sucursales */}
        <div className="flex flex-wrap gap-2 mb-6">
          {pedidosPorSucursal.map((sucursal) => (
            <button
              key={sucursal.sucursalId}
              onClick={() => setActiveTab(sucursal.sucursalId)}
              className={`px-4 py-2 rounded-t-lg font-semibold flex items-center gap-2 transition-all
                ${activeTab === sucursal.sucursalId
                  ? "bg-green-600 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-green-50"}`}
            >
              <FaStore />
              {sucursal.sucursalNombre}
              <span className="ml-2 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                {sucursal.pedidos.length}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="mb-4 flex items-center gap-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código de control..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Contenido de la sucursal activa */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando pedidos...</div>
          ) : (
            pedidosPorSucursal.map(
              (sucursal) =>
                sucursal.sucursalId === activeTab && (
                  <div key={sucursal.sucursalId}>
                    <div className="flex items-center gap-2 mb-4">
                      <FaStore className="text-green-600" />
                      <h2 className="text-xl font-bold text-gray-800">
                        {sucursal.sucursalNombre}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({sucursal.pedidos.length} pedido{(sucursal.pedidos.length !== 1) && "s"})
                      </span>
                    </div>
                    {sucursal.pedidos.length === 0 ? (
                      <div className="text-gray-500 flex items-center gap-2 py-8 justify-center">
                        <FaBoxOpen className="text-2xl" />
                        No hay pedidos registrados para esta sucursal.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                CÓDIGO CONTROL
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                PROVEEDOR
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                FECHA
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                USUARIO
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                ESTADO
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                TOTAL
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                                DETALLES
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {sucursal.pedidos
                              .filter(pedido =>
                                pedido.codigo_control
                                  ?.toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                              )
                              .map((pedido) => (
                                <tr key={pedido.id} className="hover:bg-green-50">
                                  <td className="px-3 py-2 text-center font-medium text-gray-800 whitespace-nowrap">{pedido.codigo_control}</td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">{pedido.proveedor_nombre}</td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <FaCalendarAlt className="text-green-400" />
                                      <span>{formatDate(pedido.fecha)}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <FaUser className="text-green-400" />
                                      <span>{pedido.usuario_nombre}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center capitalize whitespace-nowrap">
                                    {editingEstadoId === pedido.id ? (
                                      <select
                                        value={pedido.estado}
                                        onChange={e => handleUpdateEstado(pedido.id, e.target.value)}
                                        onBlur={() => setEditingEstadoId(null)}
                                        className="border rounded px-2 py-1 text-xs"
                                        autoFocus
                                      >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="recibido">Recibido</option>
                                        <option value="cancelado">Cancelado</option>
                                      </select>
                                    ) : (
                                      <span
                                        className="cursor-pointer hover:underline"
                                        onClick={() => setEditingEstadoId(pedido.id)}
                                        title="Cambiar estado"
                                      >
                                        {pedido.estado}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-semibold text-green-700 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <FaMoneyBillWave />
                                      {formatCurrency(pedido.total)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <button
                                      className="text-green-600 hover:text-green-800 transition-all"
                                      onClick={() => {
                                        setSelectedPedido(pedido);
                                        setShowModal(true);
                                      }}
                                      title="Ver detalles"
                                    >
                                      <FaListUl />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {/* Si no hay resultados */}
                        {sucursal.pedidos.filter(pedido =>
                          pedido.codigo_control
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="text-gray-500 flex items-center gap-2 py-8 justify-center">
                            <FaBoxOpen className="text-2xl" />
                            No se encontraron pedidos con ese código de control.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
            )
          )}
        </div>

        {/* Modal de Detalle de Pedido */}
        {showModal && selectedPedido && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowModal(false)}
              ></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:w-full">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Detalle del pedido #{selectedPedido.id}
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-white p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">INFORMACIÓN GENERAL</h4>
                      <p className="mt-2 flex items-center">
                        <span className="font-medium text-gray-600">Fecha:</span>
                        <span className="ml-2 text-gray-800">{formatDate(selectedPedido.fecha)}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Proveedor:</span>
                        <span className="ml-2 text-gray-800">{selectedPedido.proveedor_nombre}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Usuario:</span>
                        <span className="ml-2 text-gray-800">{selectedPedido.usuario_nombre}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Estado:</span>
                        <span className="ml-2 text-gray-800">{selectedPedido.estado}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Código de control:</span>
                        <span className="ml-2 text-gray-800">{selectedPedido.codigo_control || "—"}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">N° autorización:</span>
                        <span className="ml-2 text-gray-800">{selectedPedido.numero_autorizacion || "—"}</span>
                      </p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-gray-600">Fecha de entrega:</span>
                        <span className="ml-2 text-gray-800">
                          {formatDate(selectedPedido.fecha_entrega_estimada)}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
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
                                {formatCurrency(detalle.precio_compra || 0)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(detalle.subtotal || (detalle.cantidad * detalle.precio_compra) || 0)}
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
                        {formatCurrency(getSubtotal(selectedPedido))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-900">Total:</span>
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(Number(selectedPedido.total) || getSubtotal(selectedPedido))}
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
    </div>
  );
};

export default Lista_pedidos;