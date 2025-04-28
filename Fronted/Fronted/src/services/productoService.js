import api from './apiClient';


export const productoService = {
  getAllProducts: async () => {
      console.log(' Entrando a getAllProducts()');
      try {
        console.log('Intentando obtener productos...');
        console.log('Token actual:', localStorage.getItem('access_token'));
        const id = localStorage.getItem('id');
        console.log('id actual ->>>>>>>>>>>>>>:', id);
        
        const response = await api.get(`productos/productos/1/`);
        
        console.log('✅ Productos obtenidos:', response.data);
        console.log('verificando storage --->>>', localStorage.getItem('empresa_data'));
        console.log('Productos obtenidos con éxito');
        
        return response.data;
      } catch (error) {
        console.error('❌ Error al obtener productos:', error.response ? error.response.data : error.message);
        throw error;
      }
  },


  createProduct: async (userData) => {
    try {
      const formattedData = {
        nombre: userData.name,
        precio_compra: userData.precio_compra,
        precio_venta: userData.precio_venta,
        descripcion: userData.descripcion,
        empresa_id: userData.empresa_id || 1,
      };

      const response = await api.post('productos/productos/1/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  deleteProduct: async (userData) => {
    try {
      const formattedData = {
        nombre: userData.name,
        precio_compra: userData.precio_compra,
        precio_venta: userData.precio_venta,
        descripcion: userData.descripcion,
        empresa_id: userData.empresa_id || 1,
      };

      const response = await api.delete('productos/productos/1/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  
};

