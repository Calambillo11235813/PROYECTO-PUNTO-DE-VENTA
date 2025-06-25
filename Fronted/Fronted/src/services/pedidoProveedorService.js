import api from './apiClient';

const pedidoProveedorService = {
  // Crear un pedido a proveedor
  crearPedidoProveedor: async (usuarioId, data) => {
    const response = await api.post(`/productos/pedido-proveedor/usuario/${usuarioId}/`, data);
    return response.data;
  },

  // Eliminar un pedido a proveedor
  eliminarPedidoProveedor: async (pedidoId) => {
    const response = await api.delete(`/productos/pedido-proveedor/${pedidoId}/`);
    return response.data;
  },

  // Obtener pedidos por usuario y sucursal
  getPedidosPorUsuarioYSucursal: async (usuarioId, sucursalId) => {
    const response = await api.get(`/productos/pedido-proveedor/usuario/${usuarioId}/sucursal/${sucursalId}/`);
    return response.data;
  }
};

export default pedidoProveedorService;