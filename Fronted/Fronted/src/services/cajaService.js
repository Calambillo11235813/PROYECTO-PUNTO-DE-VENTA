import api from './apiClient';

export const cajaService = {
  /**
   * Abre una nueva caja para el usuario con el monto inicial especificado
   * @param {Object} cajaData - Datos para abrir la caja
   * @param {number} cajaData.monto_inicial - Monto inicial en la caja
   * @param {number} cajaData.empleado - ID del empleado asignado a la caja
   * @returns {Promise<Object>} - Datos de la caja creada
   */
  abrirCaja: async (cajaData) => {
    console.log('Entrando a abrirCaja()');
    try {
      const id = localStorage.getItem('id');
      console.log('ID del usuario:', id);
      console.log('Datos para abrir caja:', cajaData);
      
      const formattedData = {
        monto_inicial: cajaData.monto_inicial,
        empleado: cajaData.empleado
      };
      
      console.log('Datos formateados para abrir caja:', formattedData);
      const response = await api.post(`ventas/caja/abrir/${id}/`, formattedData);
      console.log('✅ Caja abierta correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al abrir caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene la información de la caja actualmente abierta para el usuario
   * @returns {Promise<Object>} - Datos de la caja actual
   */
  getCajaActual: async () => {
    console.log('Entrando a getCajaActual()');
    try {
      const id = localStorage.getItem('id');
      console.log('Consultando caja actual para usuario:', id);
      
      const response = await api.get(`ventas/caja/actual/${id}/`);
      console.log('✅ Información de caja actual obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener caja actual:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Cierra la caja actualmente abierta para el usuario
   * @returns {Promise<Object>} - Datos del cierre de caja
   */
  cerrarCaja: async () => {
    console.log('Entrando a cerrarCaja()');
    try {
      const id = localStorage.getItem('id');
      console.log('Cerrando caja para usuario:', id);
      
      // El backend calcula los montos, solo se envía un objeto vacío
      const response = await api.patch(`ventas/caja/cerrar/${id}/`, {});
      console.log('✅ Caja cerrada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al cerrar caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
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
      
      const formattedData = {
        tipo: movimientoData.tipo,
        monto: movimientoData.monto,
        descripcion: movimientoData.descripcion
      };
      
      console.log('Datos formateados para movimiento:', formattedData);
      const response = await api.post(`ventas/caja/${cajaId}/movimientos/`, formattedData);
      console.log('✅ Movimiento registrado correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error.response ? error.response.data : error.message);
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
   * Obtiene el historial de cajas cerradas para el usuario
   * @returns {Promise<Array>} - Lista de cajas cerradas
   */
  getHistorialCajas: async () => {
    console.log('Entrando a getHistorialCajas()');
    try {
      const id = localStorage.getItem('id');
      console.log('Consultando historial de cajas para usuario:', id);
      
      const response = await api.get(`ventas/caja/historial/${id}/`);
      console.log('✅ Historial de cajas obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener historial de cajas:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene los detalles de una caja específica por su ID
   * @param {number} cajaId - ID de la caja
   * @returns {Promise<Object>} - Datos detallados de la caja
   */
  getCajaById: async (cajaId) => {
    console.log('Entrando a getCajaById()');
    try {
      console.log(`Consultando detalles de caja ID: ${cajaId}`);
      
      const response = await api.get(`ventas/caja/${cajaId}/`);
      console.log('✅ Detalles de caja obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener detalles de caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};