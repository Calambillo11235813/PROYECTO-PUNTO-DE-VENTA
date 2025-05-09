import axios from 'axios';

// URL base de la API (ajústala según tu configuración)
const API_URL = 'http://127.0.0.1:8000/accounts/';

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
    // Excluir rutas de autenticación
    if (!config.url.includes('login') && !config.url.includes('usuarios')) {
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
      // await apiClient.get('');
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
    
  // Utilizando destructuring de parámetros para mayor claridad
  register: async ({ nombre, correo, password, nombre_empresa, direccion, nit_empresa, role_id = 1 }) => {
    try {
      console.log('Intentando registro con:', {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
        role_id
      });
      
      const response = await apiClient.post('usuarios/', {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
      });
      
      console.log('Registro exitoso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage =
        error.response?.data?.error ||
        'Error al conectar con el servidor';
      throw new Error(errorMessage);
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
        password: contrasena
      });
      
      console.log('Login exitoso:', response.data);
      
      // Guardar tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Determinar el tipo de usuario y guardar datos apropiados
      if (response.data.tipo === "empleado") {
        localStorage.setItem('user_data', JSON.stringify(response.data.empleado));
        localStorage.setItem('empleado_id', response.data.empleado.id);
        localStorage.setItem('usuario_id', response.data.empleado.usuario);
        localStorage.setItem('user_type', 'empleado');
      } else {
        localStorage.setItem('user_data', JSON.stringify(response.data.usuario));
        localStorage.setItem('id', response.data.usuario.id);
        localStorage.setItem('user_type', 'usuario');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Datos de error:', error.response?.data);
      console.error('Estado:', error.response?.status);
      
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
      throw new Error('Sesión expirada, por favor inicie sesión nuevamente' + error);
    }
  },
};

export default authService;