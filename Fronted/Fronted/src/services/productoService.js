import api from './apiClient';

export const productoService = {
  getAllProducts: async () => {
      console.log(' Entrando a getAllProducts()');
      try {
        console.log('Intentando obtener productos...');
        console.log('Token actual:', localStorage.getItem('access_token'));
        const id = localStorage.getItem('id');
        console.log('id actual ->>>>>>>>>>>>>>:', id);
        
        const response = await api.get(`productos/crear/usuario/${id}/`);
        
        console.log('✅ Productos obtenidos:', response.data);
        console.log('verificando storage --->>>', localStorage.getItem('empresa_data'));
        console.log('Productos obtenidos con éxito');
        
        return response.data;
      } catch (error) {
        console.error('❌ Error al obtener productos:', error.response ? error.response.data : error.message);
        throw error;
      }
  },

  createProduct: async (formData) => {
    console.log('Entrando a createProduct() con FormData');
    const id = localStorage.getItem('id');
    const sucursal_id = localStorage.getItem('sucursal_actual_id');
    
    try {
      // Verificar el contenido del FormData
      console.log('formData', formData);
      console.log('Contenido del FormData:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'imagen' ? 'Archivo: ' + pair[1].name : pair[1]));
      }
      
      // Añadir el ID de la sucursal al formData (verificar primero si ya existe)
      if (sucursal_id && !formData.has('sucursal_id')) {
        formData.append('sucursal_id', sucursal_id);
        console.log('✅ ID de sucursal añadido al FormData:', sucursal_id);
      } else if (formData.has('sucursal_id')) {
        console.log('✅ FormData ya contiene sucursal_id:', formData.get('sucursal_id'));
      } else {
        console.warn('⚠️ No se encontró ID de sucursal en localStorage');
      }
      
      // Verificar nuevamente el formData después de añadir sucursal_id
      console.log('FormData actualizado con sucursal_id:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Configuración especial para enviar FormData con archivos
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      console.log('Enviando datos del producto con imagen al servidor...');
      const response = await api.post(`productos/crear/usuario/${id}/`, formData, config);
      
      console.log('✅ Producto creado con éxito:', response.data);
      
      // Verificar la estructura de la respuesta para la sucursal
      if (response.data.sucursal) {
        console.log('✅ Sucursal del producto creado:', response.data.sucursal.id);
      } else if (response.data.sucursal_id) {
        console.log('✅ Sucursal del producto creado:', response.data.sucursal_id);
      } else {
        console.warn('⚠️ No se encontró información de sucursal en la respuesta');
      }
      
      // Asegurarse de que el stock se refleje correctamente
      if (response.data && !response.data.stock && formData.get('stock_inicial')) {
        response.data.stock = parseInt(formData.get('stock_inicial'));
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  deleteProduct: async (userData) => {
    try {
      const id = localStorage.getItem('id');  // ID del usuario
      const producto_id = userData.id; // ID del producto a eliminar
      
      console.log(`Eliminando producto ${producto_id} del usuario ${id}...`);
      const response = await api.delete(`productos/detalles/usuario/${id}/${producto_id}/`);
      
      console.log('✅ Producto eliminado correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  EditProduct: async (userData) => {
    try {
      console.log('Entrando a EditProduct()');
      const userId = localStorage.getItem('id');
      const productoId = userData.id;
      
      // Si se envía formData (con imagen)
      if (userData.formData) {
        // Verificar contenido del formData
        console.log('Contenido del FormData para actualización:');
        for (let pair of userData.formData.entries()) {
          console.log(pair[0] + ': ' + (pair[0] === 'imagen' ? 'Archivo: ' + pair[1].name : pair[1]));
        }
        
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
        
        console.log(`Actualizando producto ${productoId} con imagen para usuario ${userId}`);
        const response = await api.put(
          `productos/detalles/usuario/${userId}/${productoId}/`, 
          userData.formData, 
          config
        );
        
        console.log('✅ Producto actualizado correctamente:', response.data);
        return response.data;
      } 
      // Si se envía un objeto normal (sin imagen)
      else {
        // Formatear los datos correctamente para el backend
        const formattedData = {
          nombre: userData.nombre,
          precio_compra: userData.precio_compra,
          precio_venta: userData.precio_venta,
          descripcion: userData.descripcion,
          stock: userData.stock,
          usuario_id: userId,
          cantidad_minima: userData.cantidad_minima || 0,
          cantidad_maxima: userData.cantidad_maxima || 0,
        };
        
        console.log(`Actualizando producto ${productoId} para usuario ${userId}:`, formattedData);
        
        const response = await api.put(`productos/detalles/usuario/${userId}/${productoId}/`, formattedData);
        console.log('✅ Producto actualizado correctamente:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene los productos de una sucursal específica
   * @param {number} userId - ID del usuario
   * @param {number} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} - Lista de productos de la sucursal
   */
  getProductosBySucursal: async (userId, sucursalId) => {
    try {
      console.log(`🔍 Obteniendo productos del usuario ${userId} en la sucursal ${sucursalId}...`);
      const response = await api.get(`/productos/crear/usuario/${userId}/sucursal/${sucursalId}/`);
      console.log('✅ Productos por sucursal obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener productos por sucursal:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};
