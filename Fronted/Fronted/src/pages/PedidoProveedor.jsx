import React, { useEffect, useState } from "react";
import pedidoProveedorService from "../services/pedidoProveedorService";
import sucursalService from "../services/SucursalService";
import { productoService } from "../services/productoService";
import proveedorService from "../services/proveedorService";
import { ShoppingCart, Building2, Package, Users, Hash, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Send } from "lucide-react";

const PedidoProveedor = () => {
  const usuarioId = localStorage.getItem("id");
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    sucursal: "",
    proveedor: "",
    fecha_entrega_estimada: "",
    codigo_control: "",
    numero_autorizacion: "",
  });
  const [detalle, setDetalle] = useState({ producto: "", cantidad: "", precio_compra: "" });
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar sucursales y proveedores al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sucursalesData, proveedoresData] = await Promise.all([
          sucursalService.getSucursalesByUsuario(usuarioId),
          proveedorService.getProveedoresByUsuario(usuarioId)
        ]);
        setSucursales(sucursalesData);
        setProveedores(proveedoresData);
      } catch (error) {
        alert("Error al cargar sucursales o proveedores");
      }
    };
    fetchData();
  }, [usuarioId]);

  // Cargar productos cuando se selecciona una sucursal
  useEffect(() => {
    const fetchProductos = async () => {
      if (form.sucursal) {
        try {
          const productosData = await productoService.getProductosBySucursal(usuarioId, form.sucursal);
          setProductos(productosData);
        } catch (error) {
          setProductos([]);
          alert("Error al cargar productos de la sucursal");
        }
      } else {
        setProductos([]);
      }
    };
    fetchProductos();
  }, [form.sucursal, usuarioId]);

  // Manejo de cambios en el formulario principal
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejo de cambios en el detalle
  const handleDetalleChange = (e) => {
    setDetalle({
      ...detalle,
      [e.target.name]: e.target.value ?? ""
    });
  };

  // Agregar producto al detalle
  const handleAddDetalle = () => {
    if (detalle.producto && detalle.cantidad && detalle.precio_compra) {
      setDetalles([...detalles, { ...detalle }]);
      setDetalle({ producto: "", cantidad: "", precio_compra: "" });
    } else {
      alert("Completa todos los campos del producto");
    }
  };

  // Eliminar producto del detalle
  const handleRemoveDetalle = (idx) => {
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

  // Enviar el pedido
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Detalles al enviar:", detalles);
    if (!form.sucursal || !form.proveedor || detalles.length === 0) {
      alert("Completa todos los campos y agrega al menos un producto");
      return;
    }
    setLoading(true);
    try {
      await pedidoProveedorService.crearPedidoProveedor(usuarioId, {
        ...form,
        detalles,
      });
      alert("Pedido realizado correctamente");
      setForm({ sucursal: "", proveedor: "", fecha_entrega_estimada: "" });
      setDetalles([]);
    } catch (error) {
      alert("Error al realizar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Pedido a Proveedor
          </h2>
          <p className="text-gray-600 text-lg">
            Gestiona tus pedidos de manera rápida y eficiente
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">Información del Pedido</h3>
          </div>
          
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sucursal */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span>Sucursal</span>
                </label>
                <select
                  name="sucursal"
                  value={form.sucursal}
                  onChange={handleChange}
                  className="w-full p-4 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 appearance-none cursor-pointer text-gray-900 hover:bg-white"
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map((suc) => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {/* Proveedor */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>Proveedor</span>
                </label>
                <select
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  className="w-full p-4 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 appearance-none cursor-pointer text-gray-900 hover:bg-white"
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Fecha estimada de entrega */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Send className="w-4 h-4 text-green-600" />
                <span>Fecha estimada de entrega</span>
              </label>
              <input
                type="date"
                name="fecha_entrega_estimada"
                value={form.fecha_entrega_estimada}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900"
                required
              />
            </div>
            {/* Código de control */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Hash className="w-4 h-4 text-green-600" />
                <span>Código de control</span>
              </label>
              <input
                type="text"
                name="codigo_control"
                value={form.codigo_control}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900"
                placeholder="Ej: ABC123"
              />
            </div>
            {/* Número de autorización */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Hash className="w-4 h-4 text-green-600" />
                <span>Número de autorización</span>
              </label>
              <input
                type="text"
                name="numero_autorizacion"
                value={form.numero_autorizacion}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900"
                placeholder="Ej: 123456789"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Realizar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* --- Agregar productos FUERA del <form> --- */}
          <div className="mt-10"> {/* Aumenta el margen superior */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-4">
                <Package className="w-4 h-4 text-green-600" />
                <span>Agregar productos al pedido</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <select
                  name="producto"
                  value={detalle.producto ?? ""}
                  onChange={handleDetalleChange}
                  className="p-3 border border-gray-200 rounded-xl bg-gray-50"
                  required
                  disabled={!form.sucursal}
                >
                  <option value="">Producto</option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="cantidad"
                  value={detalle.cantidad ?? ""}
                  onChange={handleDetalleChange}
                  placeholder="Cantidad"
                  className="p-3 border border-gray-200 rounded-xl bg-gray-50"
                  min={1}
                  required
                />
                <input
                  type="number"
                  name="precio_compra"
                  value={detalle.precio_compra ?? ""}
                  onChange={handleDetalleChange}
                  placeholder="Precio compra"
                  className="p-3 border border-gray-200 rounded-xl bg-gray-50"
                  min={0}
                  step="0.01"
                  required
                />
                <button
                  type="button"
                  onClick={handleAddDetalle}
                  className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 transition-all duration-200"
                  disabled={!detalle.producto || !detalle.cantidad || !detalle.precio_compra}
                  title="Agregar producto"
                  style={{ minWidth: "48px" }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {/* Tabla de productos agregados */}
              {detalles.length > 0 && (
                <div className="mt-4">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio compra</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detalles.map((d, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{productos.find(p => p.id === Number(d.producto))?.nombre || d.producto}</td>
                          <td className="px-4 py-2">{d.cantidad}</td>
                          <td className="px-4 py-2">{d.precio_compra}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveDetalle(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoProveedor;