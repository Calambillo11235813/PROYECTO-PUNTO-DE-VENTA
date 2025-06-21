import apiClient from './apiClient';

const rolService = {
  // Obtener todos los roles
  getAllRoles: async () => {
    try {
      const response = await apiClient.get('accounts/roles/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  // Obtener los roles de un usuario específico
  getRolesByUsuario: async (usuarioId) => {
    try {
      const response = await apiClient.get(`accounts/usuarios/${usuarioId}/roles/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener roles del usuario ${usuarioId}:`, error);
      throw error;
    }
  },

  // Obtener un rol por su ID
  getRolById: async (rolId) => {
    try {
      const response = await apiClient.get(`accounts/roles/${rolId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener rol ${rolId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo rol
  createRol: async (rolData) => {
    try {
      const response = await apiClient.post('accounts/roles/', rolData);
      return response.data;
    } catch (error) {
      console.error('Error al crear rol:', error);
      throw error;
    }
  },

  // Actualizar un rol existente
  updateRol: async (rolId, rolData) => {
    try {
      const response = await apiClient.put(`accounts/roles/${rolId}/`, rolData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar rol ${rolId}:`, error);
      throw error;
    }
  },

  // Eliminar un rol
  deleteRol: async (rolId) => {
    try {
      const response = await apiClient.delete(`accounts/roles/${rolId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar rol ${rolId}:`, error);
      throw error;
    }
  },

  // ================ GESTIÓN DE PERMISOS DEL ROL ================

  // Obtener todos los permisos de un rol
  getRolPermisos: async (rolId) => {
    try {
      const response = await apiClient.get(`accounts/roles/${rolId}/permisos/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener permisos del rol ${rolId}:`, error);
      throw error;
    }
  },

  // Añadir permisos a un rol
  addPermisosToRol: async (rolId, permisosIds) => {
    try {
      const response = await apiClient.post(`accounts/roles/${rolId}/permisos/`, {
        permisos: permisosIds
      });
      return response.data;
    } catch (error) {
      console.error(`Error al añadir permisos al rol ${rolId}:`, error);
      throw error;
    }
  },

  // Eliminar permisos de un rol
  removePermisosFromRol: async (rolId, permisosIds) => {
    try {
      const response = await apiClient.delete(`accounts/roles/${rolId}/permisos/`, {
        data: { permisos: permisosIds }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar permisos del rol ${rolId}:`, error);
      throw error;
    }
  }
};

export default rolService;