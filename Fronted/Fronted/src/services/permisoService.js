import apiClient from './apiClient';

const permisoService = {
  /**
   * Obtiene todos los permisos disponibles en el sistema
   * @returns {Promise<Array>} Lista de permisos
   */
  getAllPermisos: async () => {
    try {
      console.log('Intentando obtener permisos...');
      const response = await apiClient.get('/accounts/permisos/');
      console.log('✅ Permisos obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un permiso específico por su ID
   * @param {number} permisoId - ID del permiso
   * @returns {Promise<Object>} Datos del permiso
   */
  getPermisoById: async (permisoId) => {
    try {
      console.log(`Intentando obtener permiso con ID ${permisoId}...`);
      const response = await apiClient.get(`/accounts/permisos/${permisoId}/`);
      console.log('✅ Permiso obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener permiso con ID ${permisoId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Crea un nuevo permiso en el sistema
   * @param {Object} permisoData - Datos del permiso
   * @param {string} permisoData.nombre - Nombre único del permiso (obligatorio)
   * @param {string} permisoData.descripcion - Descripción del permiso (opcional)
   * @returns {Promise<Object>} Datos del permiso creado
   */
  createPermiso: async (permisoData) => {
    try {
      console.log('Intentando crear permiso:', permisoData);
      const response = await apiClient.post('/accounts/permisos/', permisoData);
      console.log('✅ Permiso creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear permiso:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Actualiza un permiso existente
   * @param {number} permisoId - ID del permiso a actualizar
   * @param {Object} permisoData - Datos actualizados del permiso
   * @returns {Promise<Object>} Datos del permiso actualizado
   */
  updatePermiso: async (permisoId, permisoData) => {
    try {
      console.log(`Intentando actualizar permiso con ID ${permisoId}...`);
      const response = await apiClient.put(`/accounts/permisos/${permisoId}/`, permisoData);
      console.log('✅ Permiso actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar permiso con ID ${permisoId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Elimina un permiso existente
   * @param {number} permisoId - ID del permiso a eliminar
   * @returns {Promise<Object>} Respuesta de confirmación
   */
  deletePermiso: async (permisoId) => {
    try {
      console.log(`Intentando eliminar permiso con ID ${permisoId}...`);
      const response = await apiClient.delete(`/accounts/permisos/${permisoId}/`);
      console.log('✅ Permiso eliminado correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al eliminar permiso con ID ${permisoId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Verifica si un empleado tiene un permiso específico
   * @param {number} empleadoId - ID del empleado
   * @param {string} nombrePermiso - Nombre del permiso a verificar
   * @returns {Promise<Object>} Resultado de la verificación
   */
  verificarPermisoEmpleado: async (empleadoId, nombrePermiso) => {
    try {
      console.log(`Verificando si el empleado ${empleadoId} tiene el permiso "${nombrePermiso}"...`);
      const response = await apiClient.get(`/accounts/empleados/${empleadoId}/permisos/${nombrePermiso}/`);
      console.log('✅ Verificación completada:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al verificar permiso ${nombrePermiso} para empleado ${empleadoId}:`, 
        error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene todos los permisos de un empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Promise<Object>} Lista de permisos del empleado
   */
  getPermisosEmpleado: async (empleadoId) => {
    try {
      console.log(`Obteniendo permisos del empleado ${empleadoId}...`);
      const response = await apiClient.get(`/accounts/empleados/${empleadoId}/permisos/`);
      console.log('✅ Permisos del empleado obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener permisos del empleado ${empleadoId}:`, 
        error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

export default permisoService;