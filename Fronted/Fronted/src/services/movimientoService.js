import api from './apiClient';

export const movimientoService = {
  /**
   * Registra un movimiento de efectivo (ingreso o retiro) en la caja
   * @param {number} cajaId - ID de la caja
   * @param {Object} movimientoData - Datos del movimiento
   * @param {string} movimientoData.tipo - Tipo de movimiento ('ingreso' o 'retiro')
   * @param {number} movimientoData.monto - Monto del movimiento
   * @param {string} movimientoData.descripcion - Descripción del motivo del movimiento
   * @returns {Promise<Object>} - Datos del movimiento registrado
   */
  registrarMovimiento: async (cajaId, movimientoData) => {
    console.log('Entrando a registrarMovimiento()');
    try {
      console.log(`Registrando movimiento para caja ID: ${cajaId}`);
      console.log('Datos del movimiento:', movimientoData);
      
      // Validar el ID de caja
      if (!cajaId) {
        throw new Error('ID de caja no válido');
      }
      
      const formattedData = {
        tipo: movimientoData.tipo,
        monto: movimientoData.monto,
        descripcion: movimientoData.descripcion
      };
      
      // Log the full URL for debugging
      const url = `ventas/caja/${cajaId}/movimientos/`;
      console.log('URL para registrar movimiento:', url);
      console.log('Datos formateados para movimiento:', formattedData);
      
      const response = await api.post(url, formattedData);
      console.log('✅ Movimiento registrado correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene todos los movimientos de efectivo de una caja específica
   * @param {number} cajaId - ID de la caja
   * @returns {Promise<Array>} - Lista de movimientos
   */
  getMovimientosCaja: async (cajaId) => {
    console.log('Entrando a getMovimientosCaja()');
    try {
      console.log(`Consultando movimientos para caja ID: ${cajaId}`);
      
      const response = await api.get(`ventas/caja/${cajaId}/movimientos/`);
      console.log('✅ Movimientos obtenidos correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener movimientos:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un movimiento específico por su ID
   * @param {number} cajaId - ID de la caja
   * @param {number} movimientoId - ID del movimiento
   * @returns {Promise<Object>} - Datos del movimiento
   */
  getMovimientoById: async (cajaId, movimientoId) => {
    console.log(`Consultando movimiento ID: ${movimientoId} de la caja ID: ${cajaId}`);
    try {
      const response = await api.get(`ventas/caja/${cajaId}/movimientos/${movimientoId}/`);
      console.log('✅ Movimiento obtenido correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener movimiento:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};