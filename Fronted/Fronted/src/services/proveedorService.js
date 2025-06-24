import api from './apiClient';

const proveedorService = {
  // Obtener todos los proveedores de un usuario
  getProveedoresByUsuario: async (usuarioId) => {
    const response = await api.get(`/productos/proveedor/usuario/${usuarioId}/`);
    return response.data;
  },

  // Crear proveedor
  crearProveedor: async (usuarioId, data) => {
    // data: { nombre, telefono, correo }
    const response = await api.post(`/productos/proveedor/usuario/${usuarioId}/`, data);
    return response.data;
  },

  // Editar proveedor
  editarProveedor: async (proveedorId, usuarioId, data) => {
    // data: { nombre, telefono, correo }
    const response = await api.put(`/productos/proveedor/${proveedorId}/usuario/${usuarioId}/`, data);
    return response.data;
  },

  // Eliminar proveedor
  eliminarProveedor: async (proveedorId, usuarioId) => {
    const response = await api.delete(`/productos/proveedor/${proveedorId}/usuario/${usuarioId}/`);
    return response.data;
  }
};

export default proveedorService;