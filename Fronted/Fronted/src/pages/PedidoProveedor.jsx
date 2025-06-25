import React, { useEffect, useState } from "react";
import pedidoProveedorService from "../services/pedidoProveedorService";
import sucursalService from "../services/SucursalService";
import { productoService } from "../services/productoService";
import proveedorService from "../services/proveedorService";
import { ShoppingCart, Building2, Package, Users, Hash, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const PedidoProveedor = () => {
  const usuarioId = localStorage.getItem("id");
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    sucursal: "",
    producto: "",
    proveedor: "",
    cantidad: ""
  });
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
        setForm((prev) => ({ ...prev, producto: "" }));
      }
    };
    fetchProductos();
  }, [form.sucursal, usuarioId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pedidoProveedorService.crearPedidoProveedor(usuarioId, form);
      alert("Pedido realizado correctamente");
      setForm({ sucursal: "", producto: "", proveedor: "", cantidad: "" });
      setProductos([]);
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
          
          <div className="p-6 space-y-6">
            {/* Grid Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sucursal */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span>Sucursal</span>
                </label>
                <div className="relative">
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
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Proveedor */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>Proveedor</span>
                </label>
                <div className="relative">
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
                  <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Producto - Full Width */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Package className="w-4 h-4 text-green-600" />
                <span>Producto</span>
              </label>
              <div className="relative">
                <select
                  name="producto"
                  value={form.producto}
                  onChange={handleChange}
                  className={`w-full p-4 pl-12 border border-gray-200 rounded-xl transition-all duration-200 appearance-none cursor-pointer text-gray-900 ${
                    !form.sucursal 
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 hover:bg-white'
                  }`}
                  required
                  disabled={!form.sucursal}
                >
                  <option value="">
                    {!form.sucursal ? 'Primero selecciona una sucursal' : 'Selecciona un producto'}
                  </option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre}
                    </option>
                  ))}
                </select>
                <Package className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  !form.sucursal ? 'text-gray-300' : 'text-gray-400'
                }`} />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className={`w-4 h-4 ${!form.sucursal ? 'text-gray-300' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {!form.sucursal && (
                <div className="flex items-center space-x-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-amber-600">
                    Los productos se cargarán automáticamente al seleccionar una sucursal
                  </p>
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Hash className="w-4 h-4 text-green-600" />
                <span>Cantidad</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cantidad"
                  value={form.cantidad}
                  onChange={handleChange}
                  placeholder="Ingresa la cantidad solicitada"
                  className="w-full p-4 pl-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900 placeholder-gray-500 hover:bg-white"
                  min={1}
                  required
                />
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                onClick={handleSubmit}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoProveedor;