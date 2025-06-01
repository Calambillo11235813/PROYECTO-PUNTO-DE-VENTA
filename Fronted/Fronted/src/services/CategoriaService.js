import apiClient from './apiClient';

const categoriaService = {
  // Obtener todas las categorías
  getAllCategorias: async () => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log('Intentando obtener categorías...');
      const response = await apiClient.get(`/productos/categoria/usuario/${id}/`);
      console.log('✅ Categorías obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Crear una nueva categoría
  createCategoria: async (categoriaData) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log('Intentando crear categoría:', categoriaData);
      const response = await apiClient.post(`/productos/categoria/usuario/${id}/`, {
        nombre: categoriaData.nombre,
        usuario: id
      });
      console.log('✅ Categoría creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear categoría:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Obtener una categoría específica por ID
  getCategoriaById: async (categoriaId) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando obtener categoría con ID ${categoriaId}...`);
      const response = await apiClient.get(`/productos/categoria/usuario/${id}/${categoriaId}/`);
      console.log('✅ Categoría obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener categoría con ID ${categoriaId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Actualizar una categoría existente
  updateCategoria: async (categoriaId, categoriaData) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando actualizar categoría con ID ${categoriaId}...`);
      const response = await apiClient.put(`/productos/categoria/usuario/${id}/${categoriaId}/`, {
        nombre: categoriaData.nombre,
        usuario: id
      });
      console.log('✅ Categoría actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar categoría con ID ${categoriaId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Eliminar una categoría
  deleteCategoria: async (categoriaId) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando eliminar categoría con ID ${categoriaId}...`);
      const response = await apiClient.delete(`/productos/categoria/usuario/${id}/${categoriaId}/`);
      console.log('✅ Categoría eliminada correctamente');
      return response.data || { success: true };
    } catch (error) {
      console.error(`❌ Error al eliminar categoría con ID ${categoriaId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

export default categoriaService;