import React, { useEffect, useState } from "react";
import pedidoProveedorService from "../services/pedidoProveedorService";
import sucursalService from "../services/SucursalService";
import { FaStore, FaClipboardList, FaBoxOpen, FaUser, FaCalendarAlt } from "react-icons/fa";

const Lista_pedidos = () => {
  const usuarioId = localStorage.getItem("id");
  const [sucursales, setSucursales] = useState([]);
  const [pedidosPorSucursal, setPedidosPorSucursal] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);

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
              pedidos: pedidos.map(p => ({
                ...p,
                producto: p.producto_nombre || p.producto || "Producto",
                proveedor: p.proveedor_nombre || p.proveedor || "Proveedor",
                usuario: p.usuario_nombre || p.usuario || "Usuario",
                fecha: p.fecha || p.created_at || "Sin fecha"
              }))
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
                          <thead className="bg-green-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                ID Pedido
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Producto
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Proveedor
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Cantidad
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Usuario
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {sucursal.pedidos.map((pedido) => (
                              <tr key={pedido.id} className="hover:bg-green-50">
                                <td className="px-4 py-2 font-medium text-gray-800">#{pedido.id}</td>
                                <td className="px-4 py-2">{pedido.producto}</td>
                                <td className="px-4 py-2">{pedido.proveedor}</td>
                                <td className="px-4 py-2">{pedido.cantidad}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-1">
                                    <FaCalendarAlt className="text-green-400" />
                                    <span>
                                      {pedido.fecha ? pedido.fecha.slice(0, 10) : ""}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-1">
                                    <FaUser className="text-green-400" />
                                    <span>{pedido.usuario}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Lista_pedidos;