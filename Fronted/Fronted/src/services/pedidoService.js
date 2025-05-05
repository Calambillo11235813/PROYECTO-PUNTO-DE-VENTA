import api from './apiClient';

export const pedidoService = {
  getAllPedidos: async () => {
    console.log('Entrando a getAllPedidos()');
    try {
      console.log('Intentando obtener pedidos...');
      console.log('Token actual:', localStorage.getItem('access_token'));
      const id = localStorage.getItem('id');
      console.log('id actual ->>>>>>>>>>>>>:', id);
      
      const response = await api.get(`ventas/pedidos/usuario/${id}/`);
      
      console.log('✅ Pedidos obtenidos:', response.data);
      console.log('Pedidos obtenidos con éxito');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener pedidos:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  createPedido: async (pedidoData) => {
    console.log('Entrando a createPedido()');
    const id = localStorage.getItem('id');
    try {
      // Estructura correcta según el formato requerido por el backend
      const formattedData = {
    
        total: pedidoData.total, // Agregar el campo total
        detalles_input: pedidoData.detalles_input.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        }))
      };
      
      console.log('Datos formateados para crear pedido:', formattedData);
      const response = await api.post(`ventas/pedidos/usuario/${id}/`, formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      // Agregar detalles del error para ayudar en la depuración
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },
  
  deletePedido: async (pedidoId) => {
    try {
      const id = localStorage.getItem('id');  // ID del usuario
      const response = await api.delete(`ventas/pedidos/usuario/${id}/${pedidoId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      throw error;
    }
  },
  
  getPedidoById: async (pedidoId) => {
    console.log('Entrando a getPedidoById()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.get(`ventas/pedidos/usuario/${id}/${pedidoId}/`);
      console.log('✅ Detalles del pedido obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener detalles del pedido:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  updatePedidoEstado: async (pedidoId, nuevoEstadoId) => {
    console.log('Entrando a updatePedidoEstado()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.patch(`ventas/pedidos/usuario/${id}/${pedidoId}/`, {
        estado: nuevoEstadoId
      });
      console.log('✅ Estado del pedido actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};