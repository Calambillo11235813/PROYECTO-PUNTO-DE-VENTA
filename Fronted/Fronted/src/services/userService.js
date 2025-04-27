import apiClient from './apiClient';  // Usa el cliente API unificado

const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      console.log('Intentando obtener usuarios...');
      console.log('Token actual:', localStorage.getItem('access_token'));
      
      // Usa la ruta correcta con el prefijo 'accounts'
      const response = await apiClient.get('accounts/usuarios/');
      console.log('Usuarios obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      
      if (error.response?.status === 401) {
        console.log('Error de autenticación. Intentando renovar token...');
        try {
          // Intenta renovar el token
          const authService = await import('./authService').then(module => module.default);
          await authService.refreshToken();
          
          // Reintenta la solicitud original
          const newResponse = await apiClient.get('accounts/usuarios/');
          return newResponse.data;
        } catch (refreshError) {
          console.error('No se pudo renovar el token:', refreshError);
          throw error;
        }
      }
      
      throw error;
    }
  },

  // Los otros métodos se mantienen igual, pero asegúrate de usar 'accounts/usuarios/'
  getUser: async (id) => {
    try {
      const response = await apiClient.get(`accounts/usuarios/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener usuario ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const formattedData = {
        nombre: userData.name,
        correo: userData.email,
        direccion: userData.phone,
        estado: userData.status === 'Activo',
        empresa_id: userData.empresa_id || 1,
        rol: userData.type === 'Empresa' ? 3 : 
             userData.type === 'Frecuente' ? 2 : 1,
        contraseña: userData.password || '12345678'
      };

      const response = await apiClient.post('accounts/usuarios/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const formattedData = {
        nombre: userData.name,
        correo: userData.email,
        direccion: userData.phone,
        estado: userData.status === 'Activo'
      };

      const response = await apiClient.put(`accounts/usuarios/${id}/`, formattedData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await apiClient.delete(`accounts/usuarios/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }
};

export default userService;