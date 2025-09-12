import apiClient from './apiClient';

const clienteService = {
  // Obtener todos los clientes del usuario actual
  getAllClientes: async () => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log('Intentando obtener clientes...');
      const response = await apiClient.get(`/ventas/clientes/usuario/${id}/`);
      console.log('✅ Clientes obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener clientes:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Obtener un cliente específico por ID
  getClienteById: async (clienteId) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando obtener cliente con ID ${clienteId}...`);
      const response = await apiClient.get(`/ventas/clientes/usuario/${id}/${clienteId}/`);
      console.log('✅ Cliente obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener cliente con ID ${clienteId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Crear un nuevo cliente
  createCliente: async (clienteData) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log('Intentando crear cliente:', clienteData);
      const response = await apiClient.post(`/ventas/clientes/usuario/${id}/`, {
        nombre: clienteData.nombre,
        cedula_identidad: clienteData.cedula_identidad || null,
        telefono: clienteData.telefono || null,
        direccion: clienteData.direccion || null,
        email: clienteData.email || null
      });
      
      console.log('✅ Cliente creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear cliente:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Actualizar un cliente existente (actualización completa)
  updateCliente: async (clienteId, clienteData) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando actualizar cliente con ID ${clienteId}...`);
      const response = await apiClient.put(`/ventas/clientes/usuario/${id}/${clienteId}/`, {
        nombre: clienteData.nombre,
        cedula_identidad: clienteData.cedula_identidad || null,
        telefono: clienteData.telefono || null,
        direccion: clienteData.direccion || null,
        email: clienteData.email || null
      });
      
      console.log('✅ Cliente actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar cliente con ID ${clienteId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Actualizar parcialmente un cliente
  updateClienteParcial: async (clienteId, clienteData) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando actualizar parcialmente cliente con ID ${clienteId}...`);
      // Solo envía los campos que se proporcionaron
      const response = await apiClient.patch(`/ventas/clientes/usuario/${id}/${clienteId}/`, clienteData);
      
      console.log('✅ Cliente actualizado parcialmente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar parcialmente cliente con ID ${clienteId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Eliminar un cliente
  deleteCliente: async (clienteId) => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      console.log(`Intentando eliminar cliente con ID ${clienteId}...`);
      const response = await apiClient.delete(`/ventas/clientes/usuario/${id}/${clienteId}/`);
      console.log('✅ Cliente eliminado correctamente');
      return response.data || { success: true };
    } catch (error) {
      console.error(`❌ Error al eliminar cliente con ID ${clienteId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

export default clienteService;