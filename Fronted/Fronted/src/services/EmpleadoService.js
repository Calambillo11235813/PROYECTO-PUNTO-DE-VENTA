import api from './api';

export const empleadoService = {
  getAllEmpleados: async () => {
    try {
      const id = localStorage.getItem('id'); // ID del usuario/empresa actual
      const response = await api.get(`/empleados/usuario/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  },

  getEmpleadoById: async (empleadoId) => {
    try {
      const response = await api.get(`/empleados/${empleadoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  createEmpleado: async (empleadoData) => {
    try {
      const id = localStorage.getItem('id'); // ID del usuario/empresa actual
      const response = await api.post(`/empleados/usuario/${id}/`, empleadoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear empleado:', error);
      throw error;
    }
  },

  updateEmpleado: async (empleadoId, empleadoData) => {
    try {
      const response = await api.put(`/empleados/${empleadoId}/`, empleadoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },

  deleteEmpleado: async (empleadoId) => {
    try {
      const response = await api.delete(`/empleados/${empleadoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el empleado con ID ${empleadoId}:`, error);
      throw error;
    }
  },
};