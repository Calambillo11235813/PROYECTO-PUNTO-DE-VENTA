import { Edit } from 'lucide-react';
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


  createProduct: async (userData) => {
    console.log('Entrando a createProduct()');
    const id = localStorage.getItem('id');
    try {
      const formattedData = {
        nombre: userData.name,
        precio_compra: userData.precio_compra,
        precio_venta: userData.precio_venta,
        descripcion: userData.descripcion,
        usuario_id: userData.usuario_id,
        stock_inicial: userData.stock_inicial,
        cantidad_minima: userData.cantidad_minima,
        cantidad_maxima: userData.cantidad_maxima,
      };
      console.log('Datos formateados para crear producto:', formattedData);
      const response = await api.post(`productos/crear/usuario/${id}/`, formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  deleteProduct: async (userData) => {

    try {
      const  id = localStorage.getItem('id');  // Desestructurar los valores necesarios
      const producto_id = userData.id; // Obtener el id del producto a eliminar
      const response = await api.delete(`productos/detalles/usuario/${id}/${producto_id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },

  EditProduct: async (userData) => {
    try {
      const { id, empresa_id = 1 } = userData;  // Desestructurar los valores necesarios
  
      // Se pasa el id correctamente en la URL
      const response = await api.put(`productos/productos/${empresa_id}/${id}/`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },
};

