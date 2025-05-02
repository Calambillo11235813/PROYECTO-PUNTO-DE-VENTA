import api from './apiClient';

export const pedidoService = {
  getAllPedidos: async () => {
    console.log('Entrando a getAllPedidos()');
    try {
      console.log('Intentando obtener pedidos...');
      console.log('Token actual:', localStorage.getItem('access_token'));
      const id = localStorage.getItem('id');
      console.log('id actual ->>>>>>>>>>>>>:', id);
      
      const response = await api.get(`pedidos/usuario/${id}/`);
      
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
        estado: pedidoData.estado_id,
        tipo_venta: pedidoData.tipo_venta_id,
        detalles: pedidoData.detalles.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
          // Eliminamos precio_unitario ya que el backend no lo espera aquí
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
      const response = await api.delete(`pedidos/detalles/usuario/${id}/${pedidoId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      throw error;
    }
  },
  
  // Función adicional para obtener detalles de un pedido específico
  getPedidoById: async (pedidoId) => {
    console.log('Entrando a getPedidoById()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.get(`pedidos/detalles/usuario/${id}/${pedidoId}/`);
      console.log('✅ Detalles del pedido obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener detalles del pedido:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Función para actualizar el estado de un pedido
  updatePedidoEstado: async (pedidoId, nuevoEstadoId) => {
    console.log('Entrando a updatePedidoEstado()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.patch(`pedidos/detalles/usuario/${id}/${pedidoId}/`, {
        estado: nuevoEstadoId  // Cambiado de estado_id a estado para coincidir con el serializer
      });
      console.log('✅ Estado del pedido actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};