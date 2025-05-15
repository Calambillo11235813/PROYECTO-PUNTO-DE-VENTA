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
        estado: pedidoData.estado || 1, // Por defecto "pagado" si no se especifica
        total: pedidoData.total,
        detalles_input: pedidoData.detalles_input.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        })),
        // Añadir transacciones_input directamente en la creación del pedido
        transacciones_input: pedidoData.transacciones_input || []
      };
      
      console.log('Datos formateados para crear pedido:', formattedData);
      const response = await api.post(`ventas/pedidos/usuario/${id}/`, formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear pedido:', error);
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
  },

  // Función modificada para usar la estructura correcta de transacciones_input
  // Esta función ahora crea un nuevo pedido con las transacciones
  createPedidoWithPayments: async (pedidoData, paymentData) => {
    console.log('Entrando a createPedidoWithPayments()');
    const id = localStorage.getItem('id');
    try {
      // Formatear los datos según la estructura esperada por el backend
      const formattedData = {
        estado: pedidoData.estado || 1,
        total: pedidoData.total,
        detalles_input: pedidoData.detalles_input.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        })),
        transacciones_input: paymentData.map(payment => ({
          tipo_pago_id: payment.tipo_pago_id,
          monto: payment.monto
        }))
      };
      
      console.log('Datos formateados para crear pedido con pagos:', formattedData);
      const response = await api.post(`ventas/pedidos/usuario/${id}/`, formattedData);
      console.log('✅ Pedido con pagos creado correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear pedido con pagos:', error.response ? error.response.data : error.message);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  // Conservamos esta función por si es necesario agregar pagos a un pedido existente
  assignPaymentTypes: async (pedidoId, paymentData) => {
    console.log('Entrando a assignPaymentTypes()');
    try {
      const id = localStorage.getItem('id');
      console.log('Asignando tipos de pago al pedido:', pedidoId);
      console.log('Datos de pago:', paymentData);
      
      // Formatear los datos para el backend
      const formattedData = {
        transacciones_input: paymentData.map(payment => ({
          tipo_pago_id: payment.tipo_pago_id,
          monto: payment.monto
        }))
      };
      
      console.log('Datos formateados para asignar pagos:', formattedData);
      const response = await api.patch(`ventas/pedidos/usuario/${id}/${pedidoId}/`, formattedData);
      console.log('✅ Tipos de pago asignados correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al asignar tipos de pago:', error.response ? error.response.data : error.message);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  getPedidoTransactions: async (pedidoId) => {
    console.log('Entrando a getPedidoTransactions()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.get(`ventas/pedidos/usuario/${id}/${pedidoId}/`);
      console.log('✅ Transacciones del pedido obtenidas:', response.data.transacciones);
      return response.data.transacciones;
    } catch (error) {
      console.error('❌ Error al obtener transacciones del pedido:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  deleteTransaction: async (pedidoId, transactionId) => {
    console.log('Entrando a deleteTransaction()');
    try {
      const id = localStorage.getItem('id');
      const response = await api.delete(`ventas/pedidos/usuario/${id}/${pedidoId}/transacciones/${transactionId}/`);
      console.log('✅ Transacción eliminada correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar transacción:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};