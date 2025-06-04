import apiClient from './apiClient';

const rolService = {
  /**
   * Obtiene todos los roles del sistema
   * @returns {Promise<Array>} Lista de roles
   */
  getAllRoles: async () => {
    try {
      console.log('Intentando obtener todos los roles...');
      const response = await apiClient.get('/accounts/roles/');
      console.log('✅ Roles obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener roles:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene los roles creados por un usuario específico
   * @param {number} usuarioId - ID del usuario creador
   * @returns {Promise<Object>} Datos con información del usuario y sus roles
   */
  getRolesByUsuario: async (usuarioId) => {
    try {
      console.log(`Intentando obtener roles del usuario ${usuarioId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${usuarioId}/roles/`);
      console.log('✅ Roles del usuario obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener roles del usuario ${usuarioId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un rol específico por su ID
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} Datos del rol
   */
  getRolById: async (rolId) => {
    try {
      console.log(`Intentando obtener rol con ID ${rolId}...`);
      const response = await apiClient.get(`/accounts/roles/${rolId}/`);
      console.log('✅ Rol obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener rol con ID ${rolId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Crea un nuevo rol
   * @param {Object} rolData - Datos del rol
   * @param {string} rolData.nombre_rol - Nombre del rol (obligatorio)
   * @param {Array<number>} rolData.permisos - IDs de los permisos asignados (opcional)
   * @returns {Promise<Object>} Datos del rol creado
   */
  createRol: async (rolData) => {
    try {
      // Obtener el ID del usuario del localStorage
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario en localStorage');
      }
      
      // Crear una copia del objeto para no modificar el original
      const rolDataWithUser = { 
        ...rolData,
        usuario: parseInt(userId) // Convertir a número y agregar al objeto
      };
      
      console.log('Intentando crear rol:', rolDataWithUser);
      const response = await apiClient.post('/accounts/roles/', rolDataWithUser);
      console.log('✅ Rol creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear rol:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Actualiza un rol existente
   * @param {number} rolId - ID del rol a actualizar
   * @param {Object} rolData - Datos actualizados del rol
   * @returns {Promise<Object>} Datos del rol actualizado
   */
  updateRol: async (rolId, rolData) => {
    try {
      console.log(`Intentando actualizar rol con ID ${rolId}...`);
      const response = await apiClient.put(`/accounts/roles/${rolId}/`, rolData);
      console.log('✅ Rol actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar rol con ID ${rolId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Elimina un rol existente
   * @param {number} rolId - ID del rol a eliminar
   * @returns {Promise<Object>} Respuesta de confirmación
   */
  deleteRol: async (rolId) => {
    try {
      console.log(`Intentando eliminar rol con ID ${rolId}...`);
      const response = await apiClient.delete(`/accounts/roles/${rolId}/`);
      console.log('✅ Rol eliminado correctamente');
      return response.data || { success: true };
    } catch (error) {
      console.error(`❌ Error al eliminar rol con ID ${rolId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

export default rolService;