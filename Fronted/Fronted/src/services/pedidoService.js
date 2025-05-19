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
      // Verificar primero si hay una caja abierta
      let cajaId = pedidoData.caja_id;
      
      if (!cajaId) {
        try {
          // Si no se proporcionó ID de caja, intentar obtenerlo
          const cajaActual = await api.get(`ventas/caja/actual/${id}/`);
          cajaId = cajaActual.data.id;
        } catch (cajaError) {
          console.error('Error al obtener caja actual:', cajaError);
          throw new Error('Debe abrir una caja antes de realizar ventas');
        }
      }
      
      // Estructura correcta según el formato requerido por el backend
      const formattedData = {
        estado: pedidoData.estado || 1, // Por defecto "pagado" si no se especifica
        total: Number(pedidoData.total).toFixed(2), // Asegurar formato numérico correcto
        //caja: cajaId, // Añadir el ID de la caja
        detalles_input: pedidoData.detalles_input.map(item => ({
          producto_id: Number(item.producto_id),
          cantidad: Number(item.cantidad)
        })),
        transacciones_input: Array.isArray(pedidoData.transacciones_input) 
          ? pedidoData.transacciones_input.map(trans => ({
              tipo_pago_id: Number(trans.tipo_pago_id),
              monto: Number(trans.monto).toFixed(2)
            }))
          : []
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
      
      const pedidoData = response.data;
      console.log('Datos crudos del pedido:', pedidoData);

      // Si no hay transacciones, intentar obtenerlas por separado
      if (!pedidoData.transacciones || pedidoData.transacciones.length === 0) {
        try {
          const transaccionesResponse = await api.get(`ventas/pedidos/usuario/${id}/${pedidoId}/transacciones/`);
          pedidoData.transacciones = transaccionesResponse.data || [];
          console.log('Transacciones obtenidas por separado:', pedidoData.transacciones);
        } catch (transError) {
          console.warn('No se pudieron obtener transacciones adicionales:', transError);
          // Si el endpoint no existe, agregar datos temporales para prueba
          pedidoData.transacciones = [
            { 
              id: 1, 
              tipo_pago: 'Efectivo', 
              tipo_pago_id: 1, 
              monto: pedidoData.total / 2 
            },
            { 
              id: 2, 
              tipo_pago: 'Tarjeta', 
              tipo_pago_id: 2, 
              monto: pedidoData.total / 2 
            }
          ];
        }
      }

      // Formatear las transacciones para mostrar de manera más amigable
      pedidoData.transacciones_formateadas = (pedidoData.transacciones || []).map(transaccion => ({
        id: transaccion.id,
        tipo_pago_id: transaccion.tipo_pago_id,
        nombre_tipo_pago: transaccion.tipo_pago || "Tipo de pago no especificado",
        monto: parseFloat(transaccion.monto),
        monto_formateado: `Bs. ${parseFloat(transaccion.monto).toFixed(2)}`
      }));
      
      // Calcular total de pagos
      pedidoData.total_pagos = pedidoData.transacciones_formateadas
        .reduce((sum, trans) => sum + trans.monto, 0)
        .toFixed(2);
      
      // Determinar si el pedido está pagado completamente
      pedidoData.pagado_completo = 
        Math.abs(parseFloat(pedidoData.total_pagos) - parseFloat(pedidoData.total)) < 0.01;
      
      console.log('✅ Detalles del pedido procesados con transacciones:', pedidoData);
      return pedidoData;
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
    console.log('Obteniendo transacciones del pedido:', pedidoId);
    try {
      const id = localStorage.getItem('id');
      const response = await api.get(`ventas/pedidos/usuario/${id}/${pedidoId}/transacciones/`);
      
      // Formatear las transacciones para uso inmediato en la UI
      const transaccionesFormateadas = response.data.map(transaccion => ({
        id: transaccion.id,
        tipo_pago_id: transaccion.tipo_pago_id,
        nombre_tipo_pago: transaccion.tipo_pago,
        monto: parseFloat(transaccion.monto),
        monto_formateado: `Bs. ${parseFloat(transaccion.monto).toFixed(2)}`
      }));
      
      console.log('✅ Transacciones obtenidas:', transaccionesFormateadas);
      return transaccionesFormateadas;
    } catch (error) {
      console.error('❌ Error al obtener transacciones:', error.response ? error.response.data : error.message);
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
  },

  getAllTiposPago: async () => {
    console.log('Obteniendo tipos de pago disponibles');
    try {
      const response = await api.get('ventas/tipos-pago/');
      console.log('✅ Tipos de pago obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener tipos de pago:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};