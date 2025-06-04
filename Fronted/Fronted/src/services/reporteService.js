import apiClient from './apiClient';

/**
 * Servicio para gestionar todos los reportes del sistema
 */
const reporteService = {
  /**
   * Obtiene un reporte de productos según el tipo y filtros especificados
   * @param {Object} params - Parámetros para el reporte
   * @param {string} params.tipo - Tipo de reporte ('inventario', 'stock_bajo', 'categorias')
   * @param {Object} params.filtros - Filtros adicionales para el reporte
   * @returns {Promise<Object>} Datos del reporte
   */
  getReporteProductos: async ({ tipo = 'inventario', filtros = {} }) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...filtros
      }).toString();
      
      console.log(`Solicitando reporte de productos de tipo '${tipo}' con filtros:`, filtros);
      const response = await apiClient.get(`/productos/reportes/usuario/${id}/?${queryParams}`);
      
      console.log('✅ Reporte de productos obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de productos:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un reporte de ventas según el tipo y filtros especificados
   * @param {Object} params - Parámetros para el reporte
   * @param {string} params.tipo - Tipo de reporte ('general', 'productos', 'clientes')
   * @param {Object} params.filtros - Filtros adicionales para el reporte (fecha_inicio, fecha_fin, cliente_id, etc)
   * @returns {Promise<Object>} Datos del reporte
   */
  getReporteVentas: async ({ tipo = 'general', filtros = {} }) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...filtros
      }).toString();
      
      console.log(`Solicitando reporte de ventas de tipo '${tipo}' con filtros:`, filtros);
      const response = await apiClient.get(`/ventas/reportes/ventas/usuario/${id}/?${queryParams}`);
      
      console.log('✅ Reporte de ventas obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de ventas:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un reporte de clientes según el tipo y filtros especificados
   * @param {Object} params - Parámetros para el reporte
   * @param {string} params.tipo - Tipo de reporte ('general')
   * @param {Object} params.filtros - Filtros adicionales para el reporte
   * @returns {Promise<Object>} Datos del reporte
   */
  getReporteClientes: async ({ tipo = 'general', filtros = {} }) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }

      // Construir parámetros de la URL
      const params = new URLSearchParams({
        tipo: tipo,
        ...filtros // Incluye search, fecha_inicio, fecha_fin si existen
      });

      console.log('🔍 Obteniendo reporte de clientes:', {
        usuario_id: id,
        tipo,
        filtros,
        url: `/ventas/reportes/clientes/usuario/${id}/?${params.toString()}`
      });

      const response = await apiClient.get(`/ventas/reportes/clientes/usuario/${id}/?${params.toString()}`);
      
      console.log('✅ Reporte de clientes obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo reporte de clientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene un reporte de caja según el tipo y filtros especificados
   * @param {Object} params - Parámetros para el reporte
   * @param {string} params.tipo - Tipo de reporte ('resumen', 'detallado') 
   * @param {Object} params.filtros - Filtros adicionales para el reporte (fecha_inicio, fecha_fin, caja_id)
   * @returns {Promise<Object>} Datos del reporte
   */
  getReporteCaja: async ({ tipo = 'resumen', filtros = {} }) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...filtros
      }).toString();
      
      console.log(`Solicitando reporte de caja de tipo '${tipo}' con filtros:`, filtros);
      const response = await apiClient.get(`/ventas/reportes/caja/usuario/${id}/?${queryParams}`);
      
      console.log('✅ Reporte de caja obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene un reporte de movimientos de caja según los filtros especificados
   * @param {Object} filtros - Filtros para el reporte (fecha_inicio, fecha_fin, caja_id)
   * @returns {Promise<Object>} Datos del reporte
   */
  getReporteMovimientos: async (filtros = {}) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams(filtros).toString();
      
      console.log('Solicitando reporte de movimientos con filtros:', filtros);
      const response = await apiClient.get(`/ventas/reportes/movimientos/usuario/${id}/?${queryParams}`);
      
      console.log('✅ Reporte de movimientos obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de movimientos:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Exporta un reporte a formato PDF
   * @param {string} tipoReporte - Tipo de reporte ('productos', 'ventas', 'clientes', 'caja', 'movimientos')
   * @param {Object} datos - Datos del reporte a exportar
   * @returns {Promise<Blob>} Archivo PDF generado
   */
  exportarReportePDF: async (tipoReporte, datos) => {
    try {
      console.log(`Exportando reporte de ${tipoReporte} a PDF...`);
      
      const response = await apiClient.post('/reportes/exportar/pdf', {
        tipo_reporte: tipoReporte,
        datos: datos
      }, {
        responseType: 'blob' // Importante para recibir el PDF como blob
      });
      
      // Crear un objeto URL para el blob recibido
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un enlace invisible y hacer clic en él para descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar el objeto URL creado
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log('✅ Reporte exportado correctamente');
      return blob;
    } catch (error) {
      console.error('❌ Error al exportar reporte a PDF:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Exporta un reporte a formato Excel
   * @param {string} tipoReporte - Tipo de reporte ('productos', 'ventas', 'clientes', 'caja', 'movimientos')
   * @param {Object} datos - Datos del reporte a exportar
   * @returns {Promise<Blob>} Archivo Excel generado
   */
  exportarReporteExcel: async (tipoReporte, datos) => {
    try {
      console.log(`Exportando reporte de ${tipoReporte} a Excel...`);
      
      const response = await apiClient.post('/reportes/exportar/excel', {
        tipo_reporte: tipoReporte,
        datos: datos
      }, {
        responseType: 'blob' // Importante para recibir el Excel como blob
      });
      
      // Crear un objeto URL para el blob recibido
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un enlace invisible y hacer clic en él para descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar el objeto URL creado
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log('✅ Reporte exportado correctamente');
      return blob;
    } catch (error) {
      console.error('❌ Error al exportar reporte a Excel:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Helper para formatear fechas para uso en filtros
   * @param {Date} date - Fecha a formatear
   * @returns {string} Fecha formateada en formato YYYY-MM-DD
   */
  formatDate: (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
};

export default reporteService;