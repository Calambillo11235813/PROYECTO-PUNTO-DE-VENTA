import React, { useEffect, useState } from "react";
import pedidoProveedorService from "../services/pedidoProveedorService";
import sucursalService from "../services/SucursalService";
import { productoService } from "../services/productoService";
import proveedorService from "../services/proveedorService";

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
    // eslint-disable-next-line
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
    <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray mb-6">Pedido a Proveedor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selección de sucursal */}
        <select
          name="sucursal"
          value={form.sucursal}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        >
          <option value="">Selecciona una sucursal</option>
          {sucursales.map((suc) => (
            <option key={suc.id} value={suc.id}>
              {suc.nombre}
            </option>
          ))}
        </select>

        {/* Selección de producto */}
        <select
          name="producto"
          value={form.producto}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
          disabled={!form.sucursal}
        >
          <option value="">Selecciona un producto</option>
          {productos.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.nombre}
            </option>
          ))}
        </select>

        {/* Selección de proveedor */}
        <select
          name="proveedor"
          value={form.proveedor}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.nombre}
            </option>
          ))}
        </select>

        {/* Cantidad */}
        <input
          type="number"
          name="cantidad"
          value={form.cantidad}
          onChange={handleChange}
          placeholder="Cantidad"
          className="w-full p-2 border border-gray-300 rounded"
          min={1}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Realizar Pedido"}
        </button>
      </form>
    </div>
  );
};

export default PedidoProveedor;