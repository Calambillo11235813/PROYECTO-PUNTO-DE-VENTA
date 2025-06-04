import apiClient from './apiClient';

const planService = {
  /**
   * Obtener todos los planes disponibles
   * @returns {Promise<Array>} - Lista de planes
   */
  getAllPlans: async () => {
    try {
      console.log('🔍 Obteniendo todos los planes...');
      const response = await apiClient.get('/accounts/planes/');
      console.log('✅ Planes obtenidos exitosamente:', response.data);
      
      // Formatear datos para mejor uso en UI
      const planesFormateados = response.data.map(plan => ({
        ...plan,
        precio_formateado: `Bs. ${parseFloat(plan.precio).toFixed(2)}`,
        caracteristicas_formateadas: plan.caracteristicas ? JSON.parse(plan.caracteristicas) : [],
        es_popular: plan.nombre === 'intermedio', // Marcar plan intermedio como popular
        ahorro_anual: plan.duracion === 'anual' ? (plan.precio * 0.20).toFixed(2) : 0
      }));
      
      return planesFormateados;
    } catch (error) {
      console.error('❌ Error al obtener planes:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener detalles de un plan específico
   * @param {number} planId - ID del plan
   * @returns {Promise<Object>} - Detalles del plan
   */
  getPlanById: async (planId) => {
    try {
      console.log(`🔍 Obteniendo plan con ID: ${planId}...`);
      const response = await apiClient.get(`/accounts/planes/${planId}/`);
      console.log('✅ Plan obtenido exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener plan ${planId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener suscripción actual del usuario
   * @returns {Promise<Object>} - Datos de la suscripción
   */
  getUserSubscription: async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      console.log(`🔍 Obteniendo suscripción del usuario ${userId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${userId}/suscripcion/`);
      console.log('✅ Suscripción obtenida exitosamente:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Usuario no tiene suscripción activa');
        return null;
      }
      console.error('❌ Error al obtener suscripción:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Crear nueva suscripción para el usuario
   * @param {Object} suscripcionData - Datos de la suscripción
   * @returns {Promise<Object>} - Suscripción creada
   */
  createSubscription: async (suscripcionData) => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      console.log('🔄 Creando nueva suscripción...', suscripcionData);
      const response = await apiClient.post(`/accounts/usuarios/${userId}/suscripcion/`, suscripcionData);
      console.log('✅ Suscripción creada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear suscripción:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Actualizar suscripción existente (cambio de plan o renovación)
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Suscripción actualizada
   */
  updateSubscription: async (updateData) => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      console.log('🔄 Actualizando suscripción...', updateData);
      const response = await apiClient.put(`/accounts/usuarios/${userId}/suscripcion/`, updateData);
      console.log('✅ Suscripción actualizada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar suscripción:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verificar límites del plan actual
   * @returns {Promise<Object>} - Información de límites
   */
  getUserLimits: async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      console.log(`🔍 Verificando límites del usuario ${userId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${userId}/limites/`);
      console.log('✅ Límites obtenidos exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener límites:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener historial de cambios de suscripción
   * @returns {Promise<Array>} - Historial de suscripciones
   */
  getSubscriptionHistory: async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        throw new Error('No se encontró ID de usuario');
      }

      console.log(`🔍 Obteniendo historial de suscripción del usuario ${userId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${userId}/historial-suscripcion/`);
      console.log('✅ Historial obtenido exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener historial:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Simular proceso de pago (para demo)
   * @param {Object} paymentData - Datos de pago
   * @returns {Promise<Object>} - Resultado del pago
   */
  processPayment: async (paymentData) => {
    try {
      console.log('💳 Procesando pago...', paymentData);
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito del pago (90% de probabilidad)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('✅ Pago procesado exitosamente:', transactionId);
        return {
          success: true,
          transaction_id: transactionId,
          message: 'Pago procesado exitosamente',
          amount: paymentData.amount,
          method: paymentData.method
        };
      } else {
        throw new Error('Error en el procesamiento del pago');
      }
    } catch (error) {
      console.error('❌ Error al procesar pago:', error.message);
      throw error;
    }
  },

  /**
   * Validar si el usuario puede acceder a una funcionalidad
   * @param {string} feature - Nombre de la funcionalidad
   * @returns {Promise<boolean>} - Puede acceder o no
   */
  canAccessFeature: async (feature) => {
    try {
      const limits = await planService.getUserLimits();
      return limits.funcionalidades[feature] || false;
    } catch (error) {
      console.error('❌ Error al verificar acceso a funcionalidad:', error.message);
      return false;
    }
  },

  /**
   * Verificar si puede agregar más recursos de un tipo específico
   * @param {string} resourceType - Tipo de recurso (productos, empleados, etc.)
   * @returns {Promise<boolean>} - Puede agregar o no
   */
  canAddResource: async (resourceType) => {
    try {
      const limits = await planService.getUserLimits();
      return limits.limites[resourceType]?.puede_agregar || false;
    } catch (error) {
      console.error('❌ Error al verificar límite de recurso:', error.message);
      return false;
    }
  }
};

export default planService;