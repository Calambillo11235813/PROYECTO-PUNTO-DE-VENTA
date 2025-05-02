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
        
<<<<<<< HEAD
        const response = await api.get(`productos/productos/1/`);
=======
        const response = await api.get(`productos/crear/usuario/1/`);
>>>>>>> origin/Diogo
        
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
<<<<<<< HEAD
=======
    console.log('Entrando a createProduct()');
    const id = localStorage.getItem('id');
>>>>>>> origin/Diogo
    try {
      const formattedData = {
        nombre: userData.name,
        precio_compra: userData.precio_compra,
        precio_venta: userData.precio_venta,
        descripcion: userData.descripcion,
<<<<<<< HEAD
        empresa_id: userData.empresa_id || 1,
      };

      const response = await api.post('productos/productos/1/', formattedData);
=======
        usuario_id: userData.usuario_id,
        stock_inicial: userData.stock_inicial,
        cantidad_minima: userData.cantidad_minima,
        cantidad_maxima: userData.cantidad_maxima,
      };
      console.log('Datos formateados para crear producto:', formattedData);
      const response = await api.post(`productos/crear/usuario/${id}/`, formattedData);
>>>>>>> origin/Diogo
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },
<<<<<<< HEAD
  deleteProduct: async (userData) => {
    try {
      const { id, empresa_id = 1 } = userData;  // Desestructurar los valores necesarios
  
      // Se pasa el id correctamente en la URL
      const response = await api.delete(`productos/productos/${empresa_id}/${id}/`);
=======

  deleteProduct: async (userData) => {

    try {
      const  id = localStorage.getItem('id');  // Desestructurar los valores necesarios
      const producto_id = userData.id; // Obtener el id del producto a eliminar
      const response = await api.delete(`productos/detalles/usuario/${id}/${producto_id}/`);
>>>>>>> origin/Diogo
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

