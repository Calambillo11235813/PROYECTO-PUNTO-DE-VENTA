import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/accounts/';

// Crear una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      console.log('Intentando obtener usuarios...');
      console.log('Token actual:', localStorage.getItem('access_token'));
      
      const response = await apiClient.get('usuarios/');
      console.log('Usuarios obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      
      if (error.response?.status === 401) {
        console.log('Error de autenticación. Intentando renovar token...');
        try {
          const authService = await import('./authService').then(module => module.default);
          await authService.refreshToken();
          
          const newResponse = await apiClient.get('usuarios/');
          return newResponse.data;
        } catch (refreshError) {
          console.error('No se pudo renovar el token:', refreshError);
          throw error;
        }
      }
      
      throw error;
    }
  },

  /**
   * Obtener información de un usuario específico
   * @param {number} userId - ID del usuario
   * @returns {Promise} - Promesa con los datos del usuario
   */
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`usuarios/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      const errorMessage = 
        error.response?.data?.detail || 
        'Error al obtener información del usuario';
      throw new Error(errorMessage);
    }
  },

  /**
   * Obtener información del usuario actual
   * @returns {Promise} - Promesa con los datos del usuario actual
   */
  getCurrentUserDetails: async () => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (!userData.id) {
      throw new Error('No hay usuario autenticado');
    }
    
    try {
      return await userService.getUserById(userData.id);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  },

  // Crear un nuevo usuario
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

      const response = await apiClient.post('usuarios/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  /**
   * Editar información de usuario 
   * @param {number} userId - ID del usuario a editar
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise} - Promesa con los datos del usuario actualizado
   */
  editUser: async (userId, userData) => {
    try {
      console.log('Intentando actualizar usuario:', userId);
      console.log('Datos para actualización:', userData);

      const dataToSend = { ...userData };
      
      if (dataToSend.password && dataToSend.password.trim() === '') {
        delete dataToSend.password;
      }

      const response = await apiClient.put(`usuarios/${userId}/`, dataToSend);
      
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      if (currentUser.id === userId) {
        const updatedUserData = {
          ...currentUser,
          nombre: response.data.nombre,
          correo: response.data.correo,
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
      }
      
      console.log('Usuario actualizado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado de la respuesta:', error.response.status);
      }
      
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.error ||
        'Error al conectar con el servidor';
      
      throw new Error(errorMessage);
    }
  },

  // Eliminar un usuario
  deleteUser: async (id) => {
    try {
      await apiClient.delete(`usuarios/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }
};

export default userService;