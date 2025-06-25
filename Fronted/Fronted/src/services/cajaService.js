import api from './apiClient';

function logStorageContents() {
  console.log('📋 ========== CONTENIDO DEL LOCALSTORAGE ==========');
  const items = { ...localStorage };
  
  // Mostrar cada elemento del localStorage de forma ordenada
  for (const [key, value] of Object.entries(items)) {
    console.log(`📌 ${key}: ${value}`);
  }
  
  // Para tokens JWT, intentamos decodificar y mostrar su contenido
  if (items.token) {
    try {
      const payload = items.token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      console.log('🔑 Contenido del token JWT:', decodedPayload);
    } catch (e) {
      console.log('⚠️ No se pudo decodificar el token JWT');
    }
  }
  
  console.log('📋 ==============================================');
}

export const cajaService = {
  /**
   * Abre una nueva caja para el usuario con el monto inicial especificado en la sucursal actual
   */
  abrirCaja: async (cajaData) => {
    console.log('🏁 Entrando a abrirCaja()');
    logStorageContents();
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id'); 
      
      // Validar que exista una sucursal seleccionada
      if (!sucursalId) {
        console.error('❌ Error: No hay una sucursal seleccionada para abrir la caja');
        throw new Error('Debe seleccionar una sucursal antes de abrir la caja');
      }
      
      console.log(`🏪 Abriendo caja para usuario: ${id} en sucursal: ${sucursalId}`);
      
      const formattedData = {
        monto_inicial: cajaData.monto_inicial,
        empleado: cajaData.empleado,
        sucursal: parseInt(sucursalId) // Asegurarse que sea número
      };
      
      console.log('📝 Datos para abrir caja:', formattedData);
      
      const response = await api.post(`ventas/caja/abrir/${id}/`, formattedData);
      console.log(`✅ Caja abierta exitosamente en sucursal ${sucursalId}:`, response.data);
      
      // Disparar evento de cambio de caja para actualizar componentes
      window.dispatchEvent(new CustomEvent('cajaChanged', { 
        detail: { 
          sucursalId: parseInt(sucursalId),
          cajaId: response.data.id 
        } 
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al abrir caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene la información de la caja actualmente abierta para el usuario en la sucursal actual
   */
  getCajaActual: async () => {
    console.log('🏁 Entrando a getCajaActual()');
    logStorageContents();
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      // Validar que exista una sucursal seleccionada
      if (!sucursalId) {
        console.error('❌ Error: No hay una sucursal seleccionada para consultar la caja');
        throw new Error('Debe seleccionar una sucursal para consultar la caja');
      }
      
      console.log(`🔍 Consultando caja actual para usuario: ${id} en sucursal ${sucursalId}`);
      
      // Incluir siempre la sucursal como parámetro obligatorio
      const endpoint = `ventas/caja/actual/${id}/?sucursal_id=${sucursalId}`;
      console.log(`🌐 Endpoint para obtener caja actual: ${endpoint}`);
      
      const response = await api.get(endpoint);
      console.log(`✅ Información de caja actual en sucursal ${sucursalId} obtenida:`, response.data);
      
      // Asegurar que siempre incluya el ID de sucursal como número
      if (response.data) {
        response.data.sucursal = parseInt(sucursalId);
      }
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`ℹ️ No hay caja abierta en la sucursal ${localStorage.getItem('sucursal_actual_id')}`);
      } else {
        console.error('❌ Error al obtener información de caja actual:', 
          error.response ? error.response.data : error.message);
      }
      throw error;
    }
  },

  /**
   * Obtiene cajas por sucursal y opcionalmente filtradas por estado
   */
  getCajasBySucursal: async (userId, sucursalId, estado = null) => {
    try {
      // Validar que exista una sucursal
      if (!sucursalId) {
        console.error('❌ Error: No se proporcionó ID de sucursal');
        throw new Error('El ID de sucursal es obligatorio');
      }
      
      let url = `/ventas/caja/historial/${userId}/?sucursal_id=${sucursalId}`;
      if (estado) {
        url += `&estado=${estado}`;
      }
      
      console.log(`🔍 Obteniendo cajas del usuario ${userId} en la sucursal ${sucursalId}...`);
      const response = await api.get(url);
      console.log(`✅ Cajas en sucursal ${sucursalId} obtenidas:`, response.data);
      
      // Asegurar que cada caja tenga el ID de sucursal correcto
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(caja => {
          caja.sucursal = parseInt(sucursalId);
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener cajas por sucursal:', 
        error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Cierra la caja actualmente abierta para el usuario en la sucursal actual
   */
  cerrarCaja: async (dataCierre = {}) => {
    console.log('🏁 Entrando a cerrarCaja()');
    logStorageContents();
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      // Validar que exista una sucursal seleccionada
      if (!sucursalId) {
        console.error('❌ Error: No hay una sucursal seleccionada para cerrar la caja');
        throw new Error('Debe seleccionar una sucursal para cerrar la caja');
      }
      
      console.log(`🔒 Cerrando caja para usuario: ${id} en sucursal ${sucursalId}`);
      console.log('📝 Datos para cierre:', dataCierre);
      
      // Incluir la sucursal como query param
      const endpoint = `ventas/caja/cerrar/${id}/?sucursal_id=${sucursalId}`;
      console.log(`🌐 Endpoint para cerrar caja: ${endpoint}`);
      
      const response = await api.patch(endpoint, dataCierre || {});
      console.log(`✅ Caja cerrada correctamente en sucursal ${sucursalId}:`, response.data);
      
      // Disparar evento de cierre de caja para actualizar la UI
      window.dispatchEvent(new CustomEvent('cajaClosed', { 
        detail: { 
          sucursalId: parseInt(sucursalId)
        } 
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al cerrar caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene el historial de cajas cerradas para el usuario, filtrado por sucursal
   */
  getHistorialCajas: async () => {
    console.log('🏁 Entrando a getHistorialCajas()');
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      // Validar que exista una sucursal seleccionada
      if (!sucursalId) {
        console.warn('⚠️ No hay sucursal seleccionada, se mostrarán cajas de todas las sucursales');
      }
      
      let endpoint = `ventas/caja/historial/${id}/`;
      if (sucursalId) {
        endpoint += `?sucursal_id=${sucursalId}`;
        console.log(`🔍 Consultando historial de cajas para usuario: ${id} en sucursal ${sucursalId}`);
      } else {
        console.log(`🔍 Consultando historial de cajas para usuario: ${id} en todas las sucursales`);
      }
      
      const response = await api.get(endpoint);
      console.log('✅ Historial de cajas obtenido:', response.data);
      
      // Asegurar que todas las cajas tengan su sucursal correcta
      if (response.data && Array.isArray(response.data) && sucursalId) {
        response.data.forEach(caja => {
          if (!caja.sucursal) {
            caja.sucursal = parseInt(sucursalId);
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener historial de cajas:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Obtiene los detalles de una caja específica por su ID
   */
  getCajaById: async (cajaId) => {
    console.log('🏁 Entrando a getCajaById()');
    try {
      console.log(`🔍 Consultando detalles de caja ID: ${cajaId}`);
      
      const response = await api.get(`ventas/caja/${cajaId}/`);
      console.log('✅ Detalles de caja obtenidos:', response.data);
      
      // Asegurar que se incluye la sucursal en los datos devueltos
      if (response.data && response.data.sucursal) {
        response.data.sucursal = parseInt(response.data.sucursal);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener detalles de caja:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  /**
   * Obtiene la sumatoria de transacciones en efectivo de ventas realizadas mientras una caja está abierta
   */
  getTransaccionesEfectivo: async (cajaId) => {
    console.log('🏁 Entrando a getTransaccionesEfectivo()');
    try {
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      // Si no se proporciona ID de caja, intentamos obtener la caja actual
      if (!cajaId) {
        console.log('🔍 No se proporcionó ID de caja, obteniendo caja actual...');
        try {
          // Asegurarse de incluir el ID de sucursal en la consulta
          const cajaActual = await cajaService.getCajaActual();
          cajaId = cajaActual.id;
          console.log(`🔑 ID de caja actual obtenido: ${cajaId} en sucursal ${sucursalId}`);
        } catch (error) {
          console.error(`❌ Error al obtener caja actual en sucursal ${sucursalId}:`, error);
          throw new Error(`No hay una caja abierta en la sucursal ${sucursalId} para obtener las transacciones`);
        }
      }
      
      console.log(`🔍 Consultando transacciones en efectivo para caja ID: ${cajaId}`);
      
      const response = await api.get(`ventas/caja/${cajaId}/transacciones/efectivo/`);
      console.log('✅ Transacciones en efectivo obtenidas:', response.data);
      
      return {
        total: response.data.total || 0,
        transacciones: response.data.transacciones || [],
        cantidad_transacciones: response.data.transacciones?.length || 0,
        sucursal_id: parseInt(sucursalId)
      };
    } catch (error) {
      console.error('❌ Error al obtener transacciones en efectivo:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Verifica si hay una caja abierta en la sucursal actual
   */
  verificarCajaAbierta: async () => {
    console.log('🏁 Verificando caja abierta en la sucursal actual');
    try {
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!sucursalId) {
        console.warn('⚠️ No hay sucursal seleccionada para verificar caja');
        return { cajaAbierta: false, mensaje: 'No hay sucursal seleccionada' };
      }
      
      console.log(`🔍 Verificando caja en sucursal: ${sucursalId}`);
      
      try {
        const cajaActual = await cajaService.getCajaActual();
        console.log(`✅ Hay una caja abierta en sucursal ${sucursalId}:`, cajaActual);
        return { 
          cajaAbierta: true, 
          cajaId: cajaActual.id, 
          sucursalId: parseInt(sucursalId),
          cajaData: cajaActual 
        };
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`ℹ️ No hay caja abierta en sucursal ${sucursalId}`);
          return { cajaAbierta: false, sucursalId: parseInt(sucursalId) };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error al verificar caja abierta:', error);
      throw error;
    }
  },
  
  /**
   * Maneja el cambio de sucursal verificando el estado de la caja
   */
  handleSucursalChange: async () => {
    console.log('🔄 Manejando cambio de sucursal...');
    try {
      const nuevaSucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!nuevaSucursalId) {
        console.warn('⚠️ No hay sucursal seleccionada después del cambio');
        return { cajaAbierta: false };
      }
      
      console.log(`🏪 Nueva sucursal seleccionada: ${nuevaSucursalId}`);
      
      // Verificar si hay caja abierta en la nueva sucursal
      const estadoCaja = await cajaService.verificarCajaAbierta();
      
      // Disparar evento con el resultado para que los componentes se actualicen
      window.dispatchEvent(new CustomEvent('sucursalCajaVerificada', { 
        detail: { 
          ...estadoCaja,
          sucursalId: parseInt(nuevaSucursalId)
        } 
      }));
      
      return estadoCaja;
    } catch (error) {
      console.error('❌ Error al manejar cambio de sucursal:', error);
      throw error;
    }
  }
};

// Agregar un event listener global para cuando cambie la sucursal
window.addEventListener('sucursalChanged', async () => {
  console.log('🔔 Evento sucursalChanged detectado. Verificando estado de caja en nueva sucursal...');
  try {
    await cajaService.handleSucursalChange();
  } catch (error) {
    console.error('❌ Error al procesar cambio de sucursal:', error);
  }
});