import api from './apiClient';

const pedidoProveedorService = {
  // Crear un pedido a proveedor
  crearPedidoProveedor: async (usuarioId, data) => {
    // data: { producto, proveedor, sucursal, cantidad }
    const response = await api.post(`/productos/pedido-proveedor/usuario/${usuarioId}/`, data);
    return response.data;
  },

  // Eliminar un pedido a proveedor
  eliminarPedidoProveedor: async (pedidoId) => {
    const response = await api.delete(`/productos/pedido-proveedor/${pedidoId}/`);
    return response.data;
  }
};

export default pedidoProveedorService;