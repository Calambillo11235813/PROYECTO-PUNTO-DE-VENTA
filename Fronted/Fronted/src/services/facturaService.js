import api from './apiClient';

/**
 * Servicio para manejar la facturación de pedidos
 */
const facturaService = {
  /**
   * Envía un pedido para facturación en el SIAT
   * @param {number} usuarioId - ID del usuario que está facturando
   * @param {number} pedidoId - ID del pedido a facturar
   * @param {Object} clienteData - Datos del cliente para la factura
   * @param {string} clienteData.cliente_nit - NIT del cliente (opcional, default '0')
   * @param {string} clienteData.cliente_nombre - Nombre del cliente (opcional)
   * @param {string} clienteData.cliente_email - Email del cliente (opcional)
   * @returns {Promise} Promesa con el resultado de la facturación
   */
  facturarPedido: async (usuarioId, pedidoId, clienteData = {}) => {
    console.log('Entrando a facturarPedido()');
    try {
      console.log(`Facturando pedido ${pedidoId} para usuario ${usuarioId}...`);
      console.log('Datos del cliente:', clienteData);
      
      // URL actualizada según el endpoint correcto
      const response = await api.post(
        `ventas/pedidos/usuario/${usuarioId}/${pedidoId}/facturar/`,
        clienteData
      );
      console.log('✅ Factura generada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al facturar pedido:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { error: 'No se recibió respuesta del servidor', details: error.request };
      } else {
        throw { error: 'Error al enviar la petición', details: error.message };
      }
    }
  },

  /**
   * Verifica el estado de una factura ya emitida en el SIAT
   * @param {number} usuarioId - ID del usuario que facturó
   * @param {number} pedidoId - ID del pedido facturado
   * @returns {Promise} Promesa con el estado actual de la factura
   */
  verificarEstadoFactura: async (usuarioId, pedidoId) => {
    console.log('Entrando a verificarEstadoFactura()');
    try {
      console.log(`Verificando estado de factura para pedido ${pedidoId}...`);
      
      // URL actualizada según el endpoint correcto
      const response = await api.get(
        `ventas/pedidos/usuario/${usuarioId}/${pedidoId}/estado-factura/`
      );
      console.log('✅ Estado de factura obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al verificar estado de factura:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { error: 'No se recibió respuesta del servidor', details: error.request };
      } else {
        throw { error: 'Error al enviar la petición', details: error.message };
      }
    }
  },

  /**
   * Prueba la conexión con el SIAT para verificar credenciales
   * @param {number} usuarioId - ID del usuario cuyas credenciales se probarán
   * @returns {Promise} Promesa con el resultado de la prueba de conexión
   */
  probarConexionSIAT: async (usuarioId) => {
    console.log('Entrando a probarConexionSIAT()');
    try {
      console.log(`Probando conexión SIAT para usuario ${usuarioId}...`);
      
      const response = await api.get(
        `ventas/test-siat/${usuarioId}/`
      );
      console.log('✅ Prueba de conexión exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al probar conexión SIAT:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { error: 'No se recibió respuesta del servidor', details: error.request };
      } else {
        throw { error: 'Error al enviar la petición', details: error.message };
      }
    }
  },

  /**
   * Busca datos de un contribuyente por NIT utilizando el sistema SIAT
   * Esta función es una utilidad para rellenar automáticamente los datos del cliente
   * @param {number} usuarioId - ID del usuario que realiza la consulta
   * @param {string} nit - NIT del contribuyente a buscar
   * @returns {Promise} Promesa con los datos del contribuyente
   */
  buscarContribuyentePorNIT: async (usuarioId, nit) => {
    console.log('Entrando a buscarContribuyentePorNIT()');
    try {
      console.log(`Buscando contribuyente con NIT ${nit} para usuario ${usuarioId}...`);
      
      const response = await api.post(
        `ventas/consultar-nit/${usuarioId}/`,
        { nit }
      );
      console.log('✅ Datos de contribuyente obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al buscar contribuyente:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else {
        throw { error: 'Error al buscar contribuyente', details: error.message };
      }
    }
  },

  /**
   * Lista todas las facturas de un usuario/empresa
   * @param {number} usuarioId - ID del usuario/empresa
   * @returns {Promise} Promesa con la lista de facturas
   */
  listarFacturasPorUsuario: async (usuarioId) => {
    console.log('Entrando a listarFacturasPorUsuario()');
    try {
      const response = await api.get(`ventas/facturas/usuario/${usuarioId}/`);
      console.log('✅ Lista de facturas obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener lista de facturas:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { error: 'No se recibió respuesta del servidor', details: error.request };
      } else {
        throw { error: 'Error al enviar la petición', details: error.message };
      }
    }
  },

  /**
   * Anula una factura emitida en el SIAT
   * @param {number} usuarioId - ID del usuario que está anulando la factura
   * @param {number} pedidoId - ID del pedido cuya factura se anulará
   * @param {Object} datosAnulacion - Datos para la anulación
   * @param {string} datosAnulacion.motivo - Motivo de la anulación (requerido)
   * @returns {Promise} Promesa con el resultado de la anulación
   */
  anularFactura: async (usuarioId, pedidoId, datosAnulacion = {}) => {
    console.log('Entrando a anularFactura()');
    try {
      console.log(`Anulando factura para pedido ${pedidoId} de usuario ${usuarioId}...`);
      console.log('Motivo de anulación:', datosAnulacion.motivo);
      
      // Verificar que se haya proporcionado un motivo
      if (!datosAnulacion.motivo || datosAnulacion.motivo.trim().length < 5) {
        throw { error: 'El motivo de anulación debe tener al menos 5 caracteres' };
      }

      const response = await api.post(
        `ventas/pedidos/usuario/${usuarioId}/${pedidoId}/factura/anular/`,
        datosAnulacion
      );
      
      console.log('✅ Factura anulada correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al anular factura:', error.response ? error.response.data : error.message);
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw { error: 'No se recibió respuesta del servidor', details: error.request };
      } else {
        throw { error: 'Error al enviar la petición', details: error.message };
      }
    }
  }
};

export default facturaService;