import apiClient from './apiClient';

const permisoService = {
  // Obtener todos los permisos
  getAllPermisos: async () => {
    try {
      const response = await apiClient.get('accounts/permisos/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw error;
    }
  },

  // Obtener un permiso específico por ID
  getPermisoById: async (permisoId) => {
    try {
      const response = await apiClient.get(`accounts/permisos/${permisoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener permiso ${permisoId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo permiso
  createPermiso: async (permisoData) => {
    try {
      const response = await apiClient.post('accounts/permisos/', permisoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear permiso:', error);
      throw error;
    }
  },

  // Actualizar un permiso existente
  updatePermiso: async (permisoId, permisoData) => {
    try {
      const response = await apiClient.put(`accounts/permisos/${permisoId}/`, permisoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar permiso ${permisoId}:`, error);
      throw error;
    }
  },

  // Eliminar un permiso
  deletePermiso: async (permisoId) => {
    try {
      const response = await apiClient.delete(`accounts/permisos/${permisoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar permiso ${permisoId}:`, error);
      throw error;
    }
  },

  // Verificar si un usuario tiene un permiso específico
  verificarPermiso: async (usuarioId, permisoNombre) => {
    try {
      const response = await apiClient.get(`accounts/usuarios/${usuarioId}/verificar-permiso/`, {
        params: { permiso: permisoNombre }
      });
      return response.data.tiene_permiso;
    } catch (error) {
      console.error(`Error al verificar permiso ${permisoNombre} para usuario ${usuarioId}:`, error);
      return false; // Si hay un error, asumimos que no tiene el permiso
    }
  }
};

export default permisoService;