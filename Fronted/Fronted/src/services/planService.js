import api from './apiClient';
import { publicApi } from './apiClient';

const planService = {
  /**
   * Obtener todos los planes disponibles (endpoint público)
   * @returns {Promise<Array>} - Lista de planes
   */
  getAllPlans: async () => {
    try {
      console.log('🔍 Obteniendo todos los planes...');
      
      // Usar publicApi para endpoints públicos
      const response = await publicApi.get('/accounts/planes/');

      if (!response.data) {
        throw new Error('Error al obtener planes');
      }

      console.log('✅ Planes obtenidos exitosamente:', response.data);
      
      // Formatear datos para mejor uso en UI
      const planesFormateados = response.data.map(plan => ({
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
      if (error.response?.status === 401) {
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
      const response = await api.get('/accounts/planes/');
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
      if (!planService.isAuthenticated()) {
        console.log('ℹ️ Usuario no autenticado, no se puede obtener suscripción');
        return null;
      }

      const userId = localStorage.getItem('id');
      console.log(`🔍 Obteniendo suscripción del usuario ${userId}...`);
      const response = await api.get(`/accounts/usuarios/${userId}/suscripcion/`);
      console.log('✅ Suscripción obtenida exitosamente:', response.data);
      return response.data;
    } catch (error) {
      // Mejorar el logging para depuración
      console.error('❌ Error al obtener suscripción:', error.message);
      
      // Manejar específicamente error 401
      if (error.response?.status === 401) {
        console.log('⚠️ Token expirado o inválido');
        try {
          // Intentar renovar el token si está disponible un servicio de renovación
          const authService = await import('./authService').then(m => m.default);
          await authService.refreshToken();
          // Reintentar después de renovar token
          const userId = localStorage.getItem('id');
          const newResponse = await api.get(`/accounts/usuarios/${userId}/suscripcion/`);
          return newResponse.data;
        } catch (refreshError) {
          console.log('No se pudo renovar el token:', refreshError.message);
          return null;
        }
      }
      
      if (error.response?.status === 404) {
        console.log('ℹ️ Usuario no tiene suscripción activa');
        return null;
      }
      
      // Para otros errores
      return null;
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
      const response = await api.get(`/accounts/usuarios/${userId}/limites/`);
      console.log('✅ Límites obtenidos exitosamente:', response.data);
      
      // Normalizar estructura para el frontend
      const normalizedData = {
        ...response.data,
        limites: {
          ...response.data.limites,
          // Crear alias para ventas_mensuales como ventas para compatibilidad
          ventas: response.data.limites.ventas_mensuales
        }
      };
      
      return normalizedData;
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
      const response = await api.get('/accounts/verify-token/');
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
        throw new Error('No se encontró ID de usuario. Asegúrate de estar logueado.');
      }

      console.log('🔄 Creando nueva suscripción...');
      console.log('📋 Datos enviados:', suscripcionData);
      console.log('👤 Usuario ID:', userId);

      // Validar datos requeridos
      const requiredFields = ['plan', 'fecha_inicio', 'fecha_expiracion'];
      const missingFields = requiredFields.filter(field => !suscripcionData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Realizar la petición
      const response = await api.post(`/accounts/usuarios/${userId}/suscripcion/`, suscripcionData);
      console.log('✅ Suscripción creada exitosamente:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error detallado al crear suscripción:');
      console.error('   - Error message:', error.message);
      console.error('   - Response data:', error.response?.data);
      console.error('   - Status:', error.response?.status);
      
      // Manejo específico de errores del backend
      if (error.response?.status === 400) {
        const backendError = error.response.data;
        if (typeof backendError === 'object' && backendError.error) {
          throw new Error(backendError.error);
        } else if (typeof backendError === 'object') {
          // Si son errores de validación de campos
          const fieldErrors = Object.entries(backendError)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(`Errores de validación: ${fieldErrors}`);
        }
      } else if (error.response?.status === 409) {
        throw new Error('El usuario ya tiene una suscripción activa');
      } else if (error.response?.status === 404) {
        throw new Error('Plan no encontrado o usuario no existe');
      } else if (error.response?.status === 401) {
        throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
      }
      
      // Error genérico
      throw new Error(error.response?.data?.error || error.message || 'Error al crear suscripción');
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
      const response = await api.put(`/accounts/usuarios/${userId}/suscripcion/`, updateData);
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
        // Simular respuesta exitosa
        return {
          success: true,
          transaction_id: `tx_${Math.random().toString(36).substring(2, 10)}`,
          amount: paymentData.amount,
          currency: paymentData.currency || 'usd',
          status: 'completed',
          timestamp: new Date().toISOString()
        };
      } else {
        // Simular error de pago
        throw new Error('El pago fue rechazado. Por favor, intente con otro método de pago.');
      }
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      throw error;
    }
  }
};

export default planService;