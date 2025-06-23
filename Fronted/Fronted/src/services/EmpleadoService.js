import apiClient from './apiClient';

export const empleadoService = {
  // Obtener todos los empleados de un usuario/empresa
  getAllEmpleados: async () => {
    try {
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      const response = await apiClient.get(`/accounts/empleados/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  },
  
  // Obtener un empleado específico por su ID
  getEmpleadoById: async (empleadoId) => {
    try {
      
      console.log('Empleado Id', empleadoId);
      // Obtener todos los empleados y filtrar
      const response = await apiClient.get(`/accounts/empleadosimple/${empleadoId}/`);
      const empleado = response.data;
      console.log('Empleados:', response.data);
      console.log('Empleados 2 :', empleado);
      if (!empleado) {
        throw new Error(`No se encontró el empleado con ID ${empleadoId}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo empleado
  createEmpleado: async (empleadoData) => {
    try {
      const id = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Agregar el ID de la sucursal si está disponible
      if (sucursalId) {
        empleadoData.sucursal = parseInt(sucursalId);
        console.log('✅ ID de sucursal añadido al empleado:', sucursalId);
      } else {
        console.warn('⚠️ No se encontró ID de sucursal en localStorage');
      }
      
      console.log('📤 Datos del empleado a enviar:', empleadoData);
      
      const response = await apiClient.post(`/accounts/empleados/${id}/`, empleadoData);
      console.log('📥 Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear empleado:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  // Actualizar un empleado existente
  updateEmpleado: async (empleadoId, empleadoData) => {
    try {
      const usuarioId = localStorage.getItem('id');
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      if (!usuarioId) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Agregar el ID de la sucursal si está disponible y no existe ya
      if (sucursalId && !empleadoData.sucursal) {
        empleadoData.sucursal = parseInt(sucursalId);
        console.log('✅ ID de sucursal añadido al empleado para actualización:', sucursalId);
      }
      
      console.log('📤 Datos de actualización de empleado:', empleadoData);
      
      // URL específica para actualización
      const response = await apiClient.put(`/accounts/empleado/${usuarioId}/${empleadoId}/`, empleadoData);
      console.log('📥 Respuesta del servidor (actualización):', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar el empleado con ID ${empleadoId}:`, error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  // Eliminar un empleado
  deleteEmpleado: async (empleadoId) => {
    try {
      const usuarioId = localStorage.getItem('id');
      if (!usuarioId) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // URL específica para eliminar
      const response = await apiClient.delete(`/accounts/empleado/${usuarioId}/${empleadoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  // Añade esta función al servicio
  toggleEmpleadoEstado: async (empleadoId, nuevoEstado) => {
    try {
      const usuarioId = localStorage.getItem('id');
      if (!usuarioId) {
        throw new Error('No se encontró ID de usuario');
      }
      
      const empleado = await empleadoService.getEmpleadoById(empleadoId);
      
      // Modificar solo el estado
      const empleadoData = {
        estado: nuevoEstado
      };
      
      const response = await apiClient.put(`/accounts/empleado/${usuarioId}/${empleadoId}/`, empleadoData);
      return response.data;
    } catch (error) {
      console.error(`Error al cambiar el estado del empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  }
};

export default empleadoService;