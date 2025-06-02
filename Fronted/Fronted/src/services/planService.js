import apiClient from './apiClient';

const planService = {
  /**
   * Obtener todos los planes disponibles (endpoint público)
   * @returns {Promise<Array>} - Lista de planes
   */
  getAllPlans: async () => {
    try {
      console.log('🔍 Obteniendo todos los planes...');
      
      // Crear una instancia de apiClient sin autenticación para endpoints públicos
      const publicApiClient = apiClient.create ? apiClient.create() : apiClient;
      
      // Hacer la petición sin headers de autenticación
      const response = await fetch('http://127.0.0.1:8000/accounts/planes/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // No incluir Authorization header para endpoints públicos
        },
      });

      if (!response.ok) {
        // Si aún falla, intentar con autenticación si está disponible
        if (response.status === 401 && planService.isAuthenticated()) {
          console.log('🔄 Reintentando con autenticación...');
          return await planService.getAllPlansAuthenticated();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Planes obtenidos exitosamente:', data);
      
      // Formatear datos para mejor uso en UI
      const planesFormateados = data.map(plan => ({
        ...plan,
        precio_formateado: `Bs. ${parseFloat(plan.precio).toFixed(2)}`,
        caracteristicas_formateadas: plan.caracteristicas ? JSON.parse(plan.caracteristicas) : [],
        es_popular: plan.nombre === 'intermedio',
        ahorro_anual: plan.duracion === 'anual' ? (plan.precio * 0.20).toFixed(2) : 0
      }));
      
      return planesFormateados;
    } catch (error) {
      console.error('❌ Error al obtener planes:', error.message);
      
      // Si es un error de autenticación, intentar obtener planes básicos
      if (error.message.includes('401')) {
        console.log('🔄 Intentando obtener planes básicos...');
        return await planService.getBasicPlans();
      }
      
      throw error;
    }
  },

  /**
   * Obtener planes con autenticación (para usuarios logueados)
   */
  getAllPlansAuthenticated: async () => {
    try {
      const response = await apiClient.get('/accounts/planes/');
      console.log('✅ Planes autenticados obtenidos:', response.data);
      
      return response.data.map(plan => ({
        ...plan,
        precio_formateado: `Bs. ${parseFloat(plan.precio).toFixed(2)}`,
        caracteristicas_formateadas: plan.caracteristicas ? JSON.parse(plan.caracteristicas) : [],
        es_popular: plan.nombre === 'intermedio',
        ahorro_anual: plan.duracion === 'anual' ? (plan.precio * 0.20).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('❌ Error al obtener planes autenticados:', error);
      throw error;
    }
  },

  /**
   * Obtener planes básicos (fallback cuando no hay autenticación)
   */
  getBasicPlans: async () => {
    console.log('📋 Cargando planes básicos...');
    
    // Planes básicos hardcodeados como fallback
    return [
      {
        id: 1,
        nombre: 'basico',
        precio: 50.00,
        descripcion: 'Plan básico para empezar',
        caracteristicas_formateadas: [
          'Hasta 100 productos',
          'Hasta 2 empleados',
          'Reportes básicos',
          'Soporte por email'
        ],
        precio_formateado: 'Bs. 50.00',
        es_popular: false,
        ahorro_anual: 0,
        limite_productos: 100,
        limite_empleados: 2,
        limite_sucursales: 1
      },
      {
        id: 2,
        nombre: 'intermedio',
        precio: 150.00,
        descripcion: 'Plan intermedio para negocios en crecimiento',
        caracteristicas_formateadas: [
          'Hasta 1000 productos',
          'Hasta 10 empleados',
          'Reportes avanzados',
          'Soporte por chat',
          'Backup automático'
        ],
        precio_formateado: 'Bs. 150.00',
        es_popular: true,
        ahorro_anual: 30,
        limite_productos: 1000,
        limite_empleados: 10,
        limite_sucursales: 3
      },
      {
        id: 3,
        nombre: 'premium',
        precio: 300.00,
        descripcion: 'Plan premium para empresas',
        caracteristicas_formateadas: [
          'Productos ilimitados',
          'Empleados ilimitados',
          'Reportes personalizados',
          'Soporte 24/7',
          'API acceso',
          'Integraciones avanzadas'
        ],
        precio_formateado: 'Bs. 300.00',
        es_popular: false,
        ahorro_anual: 60,
        limite_productos: -1, // -1 = ilimitado
        limite_empleados: -1,
        limite_sucursales: -1
      }
    ];
  },

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean} - Si el usuario está autenticado o no
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const userId = localStorage.getItem('id');
    return !!token && !!userId;
  },

  /**
   * Obtener suscripción actual del usuario (requiere autenticación)
   * @returns {Promise<Object>} - Datos de la suscripción
   */
  getUserSubscription: async () => {
    try {
      // Validar autenticación antes de intentar obtener la suscripción
      if (!planService.isAuthenticated()) {
        console.log('ℹ️ Usuario no autenticado, no se puede obtener suscripción');
        return null;
      }

      const userId = localStorage.getItem('id');
      console.log(`🔍 Obteniendo suscripción del usuario ${userId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${userId}/suscripcion/`);
      console.log('✅ Suscripción obtenida exitosamente:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Usuario no tiene suscripción activa');
        return null;
      }
      if (error.response?.status === 401) {
        console.log('ℹ️ No autorizado para obtener suscripción');
        return null;
      }
      console.error('❌ Error al obtener suscripción:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener límites del plan actual (requiere autenticación)
   * @returns {Promise<Object>} - Información de límites
   */
  getUserLimits: async () => {
    try {
      // Validar autenticación antes de intentar obtener los límites
      if (!planService.isAuthenticated()) {
        console.log('ℹ️ Usuario no autenticado, no se pueden obtener límites');
        return null;
      }

      const userId = localStorage.getItem('id');
      console.log(`🔍 Verificando límites del usuario ${userId}...`);
      const response = await apiClient.get(`/accounts/usuarios/${userId}/limites/`);
      console.log('✅ Límites obtenidos exitosamente:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('ℹ️ No autorizado para obtener límites');
        return null;
      }
      console.error('❌ Error al obtener límites:', error.response?.data || error.message);
      return null; // Retornar null en lugar de throw para evitar errores en UI
    }
  },

  /**
   * Verificar autenticación con el backend
   */
  verifyAuthentication: async () => {
    try {
      if (!planService.isAuthenticated()) {
        return false;
      }
      
      // Verificar token con el backend
      const response = await apiClient.get('/accounts/verify-token/');
      return response.status === 200;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // Limpiar localStorage si el token es inválido
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
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
   * Simular proceso de pago (para demo)
   * @param {Object} paymentData - Datos de pago
   * @returns {Promise<Object>} - Resultado del pago
   */
  processPayment: async (paymentData) => {
    try {
      // Verificar autenticación antes de procesar el pago
      const isAuthenticated = await planService.verifyAuthentication();
      if (!isAuthenticated) {
        throw new Error("No estás autorizado para realizar esta operación");
      }
      
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
      if (!limits) return false;
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
      if (!limits) return false;
      return limits.limites[resourceType]?.puede_agregar || false;
    } catch (error) {
      console.error('❌ Error al verificar límite de recurso:', error.message);
      return false;
    }
  }
};

export default planService;