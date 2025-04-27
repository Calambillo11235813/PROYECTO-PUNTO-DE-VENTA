import axios from 'axios';


// URL base de la API (ajústala según tu configuración)
const API_URL = 'http://localhost:8000/api/';

// Crea una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Solo añade token a rutas que NO sean de autenticación
    if (!config.url.includes('login/')) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicio de autenticación
const authService = {
  // Probar conexión con la API 
  
  testConnection: async () => {
    try {
      await apiClient.get('');
      console.log('Conexión exitosa');
      return true;
    } catch (error) {
      // Si es un 404, aún consideramos que hay conexión
      if (error.response && error.response.status === 404) {
        console.log('Conexión OK (404 expected)');
        return true;
      }
      console.error('Error de conexión:', error);
      return false;
    }
  },
    
    


  // Iniciar sesión
  login: async (correo, contrasena) => {
    try {

      console.log('Intentando login con:', { correo, contrasena });
    
      // Elimina cualquier token previo para asegurar una solicitud limpia
      localStorage.removeItem('access_token');
      
      // Asegúrate de enviar exactamente lo que espera el backend
      const response = await apiClient.post('login/', { 
        correo: correo,
        contraseña: contrasena  // Mantén la ñ si el backend la espera
      });
      
      console.log('Respuesta del servidor:', response.data);
      

     // Guardar tokens y datos en localStorage
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user_data', JSON.stringify(response.data.usuario));
    localStorage.setItem('empresa_data', JSON.stringify(response.data.empresa));
    

      return response.data;


    } catch (error) {
      console.error('Error completo:', error);
      console.error('Datos de error:', error.response?.data);
      console.error('Estado:', error.response?.status);
      // Manejo de errores
      const errorMessage = 
        error.response?.data?.error || 
        'Error al conectar con el servidor';
      throw new Error(errorMessage);
    }
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('empresa_data');
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return localStorage.getItem('access_token') !== null;
  },
  
  // Obtener información del usuario actual
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Refrescar el token cuando expire
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No hay token de refresco disponible');
    
    try {
      const response = await apiClient.post('token/refresh/', {
        refresh: refreshToken
      });
      
      localStorage.setItem('access_token', response.data.access);
      return response.data;
    } catch (error) {
      // Si el token de refresco también expiró, cerrar sesión
      authService.logout();
      throw new Error('Sesión expirada, por favor inicie sesión nuevamente');
    }
  },
  



};

export default authService;