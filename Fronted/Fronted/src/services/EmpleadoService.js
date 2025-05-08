import apiClient from './apiClient';

export const empleadoService = {
  // Obtener todos los empleados de un usuario/empresa
  getAllEmpleados: async () => {
    try {
      // Obtenemos el ID del usuario/empresa del localStorage
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
      const response = await apiClient.get(`/accounts/empleado/${empleadoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo empleado
  createEmpleado: async (empleadoData) => {
    try {
      // Obtenemos el ID del usuario/empresa del localStorage
      const id = localStorage.getItem('id');
      if (!id) {
        throw new Error('No se encontró ID de usuario');
      }
      
      const response = await apiClient.post(`/accounts/empleados/${id}/`, empleadoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear empleado:', error);
      throw error;
    }
  },

  // Actualizar un empleado existente
  updateEmpleado: async (empleadoId, empleadoData) => {
    try {
      const response = await apiClient.put(`/accounts/empleado/${empleadoId}/`, empleadoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  // Eliminar un empleado
  deleteEmpleado: async (empleadoId) => {
    try {
      const response = await apiClient.delete(`/accounts/empleado/${empleadoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  }
};

export default empleadoService;