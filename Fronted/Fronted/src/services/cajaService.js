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
  },

  /**
   * Obtiene la sumatoria de transacciones en efectivo de ventas realizadas mientras una caja está abierta
   * @param {number} [cajaId] - ID opcional de la caja. Si no se proporciona, se usa la caja actual.
   * @returns {Promise<Object>} - Datos de las transacciones en efectivo
   */
  getTransaccionesEfectivo: async (cajaId) => {
    console.log('Entrando a getTransaccionesEfectivo()');
    try {
      const id = localStorage.getItem('id');
      
      if (!cajaId) {
        console.log('No se proporcionó ID de caja, obteniendo caja actual...');
        try {
          const cajaActual = await cajaService.getCajaActual();
          cajaId = cajaActual.id;
        } catch (error) {
          console.error('❌ Error al obtener caja actual:', error);
          throw new Error('No hay una caja abierta para obtener las transacciones');
        }
      }
      
      console.log(`Consultando transacciones en efectivo para caja ID: ${cajaId}`);
      
      const response = await api.get(`ventas/caja/${cajaId}/transacciones/efectivo/`);
      console.log('✅ Transacciones en efectivo obtenidas:', response.data);
      
      return {
        total: response.data.total || 0,
        transacciones: response.data.transacciones || [],
        cantidad_transacciones: response.data.transacciones?.length || 0
      };
    } catch (error) {
      console.error('❌ Error al obtener transacciones en efectivo:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};