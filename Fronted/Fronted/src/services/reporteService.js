import api from './apiClient';

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
  /**
   * Obtiene un reporte de productos según el tipo y filtros especificados
   */
  getReporteProductos: async ({ tipo = 'inventario', filtros = {} }) => {
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // CORRECCIÓN: URL correcta con el prefijo /ventas/
      // ya que la ruta en urls.py está dentro de la app Ventas
      let url = '';
      
      // Si hay sucursal seleccionada, usar la ruta con sucursal
      if (sucursalId) {
        url = `/ventas/productos/reportes/usuario/${id}/sucursal/${sucursalId}/`;
      } else {
        url = `/ventas/productos/reportes/usuario/${id}/`;
      }
      
      // Resto de parámetros como query string
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...(filtros.fecha_inicio ? { fecha_inicio: filtros.fecha_inicio } : {}),
        ...(filtros.fecha_fin ? { fecha_fin: filtros.fecha_fin } : {}),
        ...(filtros.categoria_id ? { categoria_id: filtros.categoria_id } : {}),
      }).toString();
      
      console.log(`📊 Solicitando reporte de productos: ${url}?${queryParams}`);
      const response = await api.get(`${url}?${queryParams}`);
      
      console.log('✅ Reporte de productos obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de productos:', error.response?.data || error.message);
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
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Construir URL base con el prefijo correcto /ventas/
      let url = '';
      
      // Si hay sucursal seleccionada, usar la nueva ruta
      if (sucursalId) {
        url = `/ventas/reportes/ventas/usuario/${id}/sucursal/${sucursalId}/`;
      } else {
        url = `/ventas/reportes/ventas/usuario/${id}/`;
      }
      
      // Construir query string con los demás parámetros
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...(filtros.fecha_inicio ? { fecha_inicio: filtros.fecha_inicio } : {}),
        ...(filtros.fecha_fin ? { fecha_fin: filtros.fecha_fin } : {}),
      }).toString();
      
      console.log(`📊 Solicitando reporte de ventas: ${url}?${queryParams}`);
      const response = await api.get(`${url}?${queryParams}`);
      
      console.log('✅ Reporte de ventas obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener reporte de ventas:', error.response?.data || error.message);
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
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Construir URL base con el prefijo correcto /ventas/
      let url = '';
      
      // Si hay sucursal seleccionada, usar la nueva ruta
      if (sucursalId) {
        url = `/ventas/reportes/clientes/usuario/${id}/sucursal/${sucursalId}/`;
      } else {
        url = `/ventas/reportes/clientes/usuario/${id}/`;
      }

      // Construir parámetros de la URL
      const params = new URLSearchParams({
        tipo: tipo,
        ...(filtros.fecha_inicio ? { fecha_inicio: filtros.fecha_inicio } : {}),
        ...(filtros.fecha_fin ? { fecha_fin: filtros.fecha_fin } : {})
      });

      console.log('🔍 Obteniendo reporte de clientes:', {
        usuario_id: id,
        tipo,
        filtros,
        url: `${url}?${params.toString()}`
      });

      const response = await api.get(`${url}?${params.toString()}`);
      
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
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Construir URL base con el prefijo correcto /ventas/
      let url = '';
      
      // Si hay sucursal seleccionada, usar la nueva ruta
      if (sucursalId) {
        url = `/ventas/reportes/caja/usuario/${id}/sucursal/${sucursalId}/`;
      } else {
        url = `/ventas/reportes/caja/usuario/${id}/`;
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams({
        tipo: tipo,
        ...(filtros.fecha_inicio ? { fecha_inicio: filtros.fecha_inicio } : {}),
        ...(filtros.fecha_fin ? { fecha_fin: filtros.fecha_fin } : {})
      }).toString();
      
      console.log(`Solicitando reporte de caja de tipo '${tipo}' con filtros:`, filtros);
      const response = await api.get(`${url}?${queryParams}`);
      
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
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Construir URL base con el prefijo correcto /ventas/
      let url = '';
      
      // Si hay sucursal seleccionada, usar la nueva ruta
      if (sucursalId) {
        url = `/ventas/reportes/movimientos/usuario/${id}/sucursal/${sucursalId}/`;
      } else {
        url = `/ventas/reportes/movimientos/usuario/${id}/`;
      }

      // Construir query string a partir de los filtros
      const queryParams = new URLSearchParams({
        ...(filtros.fecha_inicio ? { fecha_inicio: filtros.fecha_inicio } : {}),
        ...(filtros.fecha_fin ? { fecha_fin: filtros.fecha_fin } : {})
      }).toString();
      
      console.log('Solicitando reporte de movimientos con filtros:', filtros);
      const response = await api.get(`${url}?${queryParams}`);
      
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
      
      const response = await api.post('/reportes/exportar/pdf', {
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
      
      const response = await api.post('/reportes/exportar/excel', {
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

/**
 * Obtener el ID de la sucursal actual desde localStorage
 * @returns {string|null} ID de la sucursal o null si no hay sucursal seleccionada
 */
const getSucursalActualId = () => {
  return localStorage.getItem('sucursal_actual_id');
};

/**
 * Añadir el ID de sucursal a los filtros si existe una sucursal seleccionada
 * @param {Object} filtros - Filtros originales
 * @returns {Object} Filtros con sucursal_id añadido si existe
 */
const addSucursalFilter = (filtros = {}) => {
  const sucursalId = getSucursalActualId();
  if (sucursalId) {
    return { ...filtros, sucursal_id: sucursalId };
  }
  return filtros;
};

export default reporteService;