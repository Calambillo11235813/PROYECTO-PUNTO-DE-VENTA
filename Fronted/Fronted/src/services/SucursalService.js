import apiClient from './apiClient';

// Variable para controlar llamadas en progreso
let checkingInProgress = false;
let lastCheckResult = null;
let lastCheckTime = 0;

const sucursalService = {
  /**
   * Obtiene todas las sucursales del usuario autenticado
   * @returns {Promise<Array>} - Lista de sucursales
   */
  getAllSucursales: async () => {
    try {
      console.log('Obteniendo todas las sucursales...');
      const response = await apiClient.get('/sucursales/sucursales/');
      console.log('✅ Sucursales obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener sucursales:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene una sucursal específica por su ID
   * @param {number} sucursalId - ID de la sucursal
   * @returns {Promise<Object>} - Datos de la sucursal
   */
  getSucursalById: async (sucursalId) => {
    try {
      console.log(`Obteniendo sucursal con ID ${sucursalId}...`);
      const response = await apiClient.get(`/sucursales/sucursales/${sucursalId}/`);
      console.log('✅ Sucursal obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener sucursal con ID ${sucursalId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Crea una nueva sucursal
   * @param {Object} sucursalData - Datos de la sucursal a crear
   * @returns {Promise<Object>} - Datos de la sucursal creada
   */
  createSucursal: async (sucursalData) => {
    try {
      console.log('Creando nueva sucursal:', sucursalData);
      
      // Asegurarse de que los campos vacíos se envíen como null
      const dataToSend = {
        ...sucursalData,
        // Convertir campos vacíos a null
        telefono: sucursalData.telefono || null,
        email: sucursalData.email || null,
        horario: sucursalData.horario || null
      };
      
      const response = await apiClient.post('/sucursales/sucursales/', dataToSend);
      console.log('✅ Sucursal creada correctamente:', response.data);
      
      // Verificar si es la primera sucursal y actualizarla automáticamente como actual
      const userId = localStorage.getItem('id');
      const sucursales = await sucursalService.getSucursalesByUsuario(userId);
      
      if (sucursales.length === 1) {
        localStorage.setItem('sucursal_actual_id', response.data.id);
        localStorage.setItem('sucursal_actual_nombre', response.data.nombre);
        console.log('✅ Primera sucursal establecida como actual:', response.data.id);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear sucursal:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Actualiza una sucursal existente
   * @param {number} sucursalId - ID de la sucursal a actualizar
   * @param {Object} sucursalData - Nuevos datos de la sucursal
   * @returns {Promise<Object>} - Datos de la sucursal actualizada
   */
  updateSucursal: async (sucursalId, sucursalData) => {
    try {
      console.log(`Actualizando sucursal con ID ${sucursalId}:`, sucursalData);
      const response = await apiClient.put(`/sucursales/sucursales/${sucursalId}/`, sucursalData);
      console.log('✅ Sucursal actualizada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar sucursal con ID ${sucursalId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Elimina una sucursal
   * @param {number} sucursalId - ID de la sucursal a eliminar
   * @returns {Promise<Object>} - Resultado de la operación
   */
  deleteSucursal: async (sucursalId) => {
    try {
      console.log(`Eliminando sucursal con ID ${sucursalId}...`);
      const response = await apiClient.delete(`/sucursales/sucursales/${sucursalId}/`);
      console.log('✅ Sucursal eliminada correctamente');
      return response.data || { success: true };
    } catch (error) {
      // Si el error es porque la sucursal tiene datos asociados
      if (error.response?.status === 400 && error.response?.data?.error?.includes('datos asociados')) {
        console.error('❌ No se puede eliminar la sucursal porque tiene datos asociados');
        throw new Error('No se puede eliminar esta sucursal porque tiene productos, cajas o pedidos asociados');
      }
      
      console.error(`❌ Error al eliminar sucursal con ID ${sucursalId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Verifica si el usuario tiene sucursales (con caché)
   * @returns {Promise<boolean>} - True si tiene sucursales, False si no
   */
  hasSucursales: async () => {
    try {
      // Verificar primero en localStorage
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const userId = localStorage.getItem('id');
      
      // NUEVO: Prevenir verificaciones repetidas en un corto periodo
      const lastCheckTime = parseInt(localStorage.getItem('last_sucursal_check') || '0');
      const now = Date.now();
      if (now - lastCheckTime < 2000) { // 2 segundos entre verificaciones
        console.log('🛑 Verificación reciente, usando último resultado conocido');
        return localStorage.getItem('tiene_sucursales') === 'true';
      }
      
      // Registrar tiempo de esta verificación
      localStorage.setItem('last_sucursal_check', now.toString());
      
      if (sucursalId) {
        console.log('✅ Sucursal encontrada en localStorage:', sucursalId);
        
        // Verificar si la sucursal pertenece al usuario actual
        try {
          const sucursal = await sucursalService.getSucursalById(sucursalId);
          if (sucursal && sucursal.usuario.toString() !== userId) {
            console.warn('⚠️ La sucursal almacenada no pertenece al usuario actual. Limpiando localStorage...');
            localStorage.removeItem('sucursal_actual_id');
            localStorage.removeItem('sucursal_actual_nombre');
            // No retornar aún - verificar si el usuario tiene otras sucursales
          } else {
            localStorage.setItem('tiene_sucursales', 'true');
            return true; // Si la sucursal pertenece al usuario, retornar true
          }
        } catch (error) {
          console.warn('⚠️ Error al verificar la sucursal. Limpiando localStorage...', error);
          localStorage.removeItem('sucursal_actual_id');
          localStorage.removeItem('sucursal_actual_nombre');
        }
      }
      
      // CAMBIO CLAVE: Verificar sucursales específicamente del usuario actual
      try {
        console.log('🔍 Buscando sucursales que pertenezcan al usuario actual...');
        
        // Usar getSucursalesByUsuario en lugar de getAllSucursales
        if (!userId) {
          console.warn('⚠️ No se encontró ID de usuario en localStorage');
          localStorage.setItem('tiene_sucursales', 'false');
          return false;
        }
        
        const sucursalesUsuario = await sucursalService.getSucursalesByUsuario(userId);
        const tieneSucursales = sucursalesUsuario && sucursalesUsuario.length > 0;
        
        // Solo guardar en localStorage si son sucursales propias
        if (tieneSucursales && sucursalesUsuario[0]) {
          localStorage.setItem('sucursal_actual_id', sucursalesUsuario[0].id);
          localStorage.setItem('sucursal_actual_nombre', sucursalesUsuario[0].nombre || 'Sucursal');
          console.log('✅ Guardando sucursal del usuario en localStorage:', sucursalesUsuario[0].id);
        }
        
        localStorage.setItem('tiene_sucursales', tieneSucursales.toString());
        return tieneSucursales;
      } catch (error) {
        console.error('❌ Error al obtener sucursales del usuario:', error);
        localStorage.setItem('tiene_sucursales', 'false');
        return false;
      }
    } catch (error) {
      console.error('❌ Error general al verificar sucursales:', error);
      localStorage.setItem('tiene_sucursales', 'false');
      return false;
    }
  },

  /**
   * Obtiene todas las sucursales de un usuario específico
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} - Lista de sucursales del usuario
   */
  getSucursalesByUsuario: async (usuarioId) => {
    try {
      console.log(`Obteniendo sucursales del usuario ${usuarioId}...`);
      // Actualizar la ruta para que coincida con el patrón URL del backend
      const response = await apiClient.get(`/sucursales/usuario/${usuarioId}/`);
      console.log(`✅ Sucursales del usuario ${usuarioId} obtenidas:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener sucursales del usuario ${usuarioId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  
};

export default sucursalService;