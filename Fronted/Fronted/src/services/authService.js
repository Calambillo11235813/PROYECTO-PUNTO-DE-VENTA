import api, { publicApi } from './apiClient';
import empleadoService from './EmpleadoService';

// Servicio de autenticación
const authService = {
  // Probar conexión con la API 
  testConnection: async () => {
    try {
      await publicApi.get('/accounts/');
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
    
  register: async ({ 
    nombre, 
    correo, 
    password, 
    nombre_empresa, 
    direccion, 
    nit_empresa, 
    razon_social,
    municipio,
    telefono_empresa,
    clave_siat,
    role_id = 1 
  }) => {
    try {
      console.log('Intentando registro con:', { 
        nombre, 
        correo, 
        password, 
        nombre_empresa, 
        direccion, 
        nit_empresa,
        razon_social,
        municipio,
        telefono_empresa,
        clave_siat,
        role_id 
      });
      
      // Validar campos requeridos
      const requiredFields = {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
        razon_social,
        municipio,
        telefono_empresa,
        clave_siat
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || value.trim() === '')
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Validaciones adicionales
      if (!/^\d{7,15}$/.test(nit_empresa.replace(/\s/g, ''))) {
        throw new Error('NIT debe tener entre 7 y 15 dígitos');
      }

      if (!/^\d{7,15}$/.test(telefono_empresa.replace(/\s/g, ''))) {
        throw new Error('Teléfono debe tener entre 7 y 15 dígitos');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        throw new Error('Formato de correo electrónico inválido');
      }

      // Usamos publicApi para registro (no requiere autenticación)
      const response = await publicApi.post('/accounts/usuarios/', {
        nombre,
        correo,
        password,
        nombre_empresa,
        direccion,
        nit_empresa,
        razon_social,
        municipio,
        telefono_empresa,
        clave_siat,
        // Campos estáticos según tu modelo
        codigo_sistema: 'SYS100', 
        codigo_ambiente: '2', // 2=Pruebas por defecto
      });
      
      console.log('Registro exitoso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        const backendError = error.response.data;
        if (typeof backendError === 'object') {
          // Si son errores de validación de campos
          const fieldErrors = Object.entries(backendError)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(`Errores de validación: ${fieldErrors}`);
        }
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Error al conectar con el servidor';
      throw new Error(errorMessage);
    }
  },
  
  // Iniciar sesión
  login: async (correo, contrasena) => {
    console.log('Intentando login con:', { correo, contrasena });
    try {
      // Usar publicApi para evitar problemas con tokens anteriores
      const response = await publicApi.post('/accounts/login/', { 
        correo, 
        password: contrasena
      });
      const data = response.data;
      
      // Logs de depuración
      console.log('Estructura de la respuesta del servidor:');
      console.log('- data.usuario:', data.usuario);
      console.log('- data.usuario.rol:', data.usuario.rol);
      
      // Limpiar localStorage para evitar datos obsoletos
      localStorage.clear();
      
      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('id', data.usuario.id);
      localStorage.setItem('user_type', data.tipo);
      
      // También guardar los datos completos del usuario
      localStorage.setItem('user_data', JSON.stringify(data.usuario));
      
      // Normalizar y guardar el rol correctamente
      normalizeAndSaveRole(data.usuario);
      
      // También verificar si hay sucursales y obtener la primera si existe
      try {
        const sucursalService = await import('./SucursalService').then(m => m.default);
        const tieneSucursales = await sucursalService.hasSucursales();
        console.log('Usuario tiene sucursales:', tieneSucursales);
      } catch (sucursalError) {
        console.error('Error verificando sucursales durante login:', sucursalError);
      } // <-- ESTA LLAVE FALTABA

      // Guardar tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Gestión de datos de usuario y empleado
      if (response.data.tipo === "empleado") {
        localStorage.setItem('user_data', JSON.stringify(response.data.empleado));
        localStorage.setItem('empleado_id', response.data.empleado.id);
        console.log('Empleado ID:', response.data.empleado.id);
        
        const empleadoData = await empleadoService.getEmpleadoById(response.data.empleado.id);
        console.log('Empleado:', empleadoData);
        
        localStorage.setItem('id', empleadoData.usuario);
        localStorage.setItem('usuario_id', response.data.empleado.usuario);
        localStorage.setItem('user_type', 'empleado');
        localStorage.setItem('rol', response.data.empleado.rol);
        
        console.log('ID de usuario:', empleadoData.usuario);
        console.log('Rol:', response.data.empleado.rol);
    
      } else {
        // Guardar datos completos del usuario
        localStorage.setItem('user_data', JSON.stringify(response.data.usuario));
        localStorage.setItem('id', response.data.usuario.id);
        localStorage.setItem('user_type', 'usuario');
        
        // Guardar información adicional del usuario (campos actualizados)
        localStorage.setItem('nombre_empresa', response.data.usuario.nombre_empresa || '');
        localStorage.setItem('nit_empresa', response.data.usuario.nit_empresa || '');
        localStorage.setItem('razon_social', response.data.usuario.razon_social || '');
        localStorage.setItem('municipio', response.data.usuario.municipio || '');
        localStorage.setItem('telefono_empresa', response.data.usuario.telefono_empresa || '');
        localStorage.setItem('clave_siat', response.data.usuario.clave_siat || '');
        localStorage.setItem('codigo_sistema', response.data.usuario.codigo_sistema || '');
        localStorage.setItem('codigo_ambiente', response.data.usuario.codigo_ambiente || '2');
        
        // Información del plan (string independiente de la tabla Plan)
        localStorage.setItem('plan', response.data.usuario.plan || '');
        localStorage.setItem('fecha_expiracion', response.data.usuario.fecha_expiracion || '');
        
        if (response.data.usuario.rol) {
          localStorage.setItem('rol', response.data.usuario.rol);
        }
      }
       console.log(data);
      return data;
      
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    }
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.clear();
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

  // Obtener información completa del usuario incluyendo plan y empresa
  getCurrentUserComplete: () => {
    const userData = authService.getCurrentUser();
    if (!userData) return null;

    return {
      ...userData,
      empresa: {
        nombre_empresa: localStorage.getItem('nombre_empresa'),
        nit_empresa: localStorage.getItem('nit_empresa'),
        razon_social: localStorage.getItem('razon_social'),
        municipio: localStorage.getItem('municipio'),
        telefono_empresa: localStorage.getItem('telefono_empresa'),
      },
      siat: {
        clave_siat: localStorage.getItem('clave_siat'),
        codigo_sistema: localStorage.getItem('codigo_sistema'),
        codigo_ambiente: localStorage.getItem('codigo_ambiente'),
      },
      plan: {
        nombre: localStorage.getItem('plan'),
        fecha_expiracion: localStorage.getItem('fecha_expiracion'),
      }
    };
  },

  // Obtener información de la empresa
  getCompanyInfo: () => {
    return {
      nombre_empresa: localStorage.getItem('nombre_empresa') || '',
      nit_empresa: localStorage.getItem('nit_empresa') || '',
      razon_social: localStorage.getItem('razon_social') || '',
      municipio: localStorage.getItem('municipio') || '',
      telefono_empresa: localStorage.getItem('telefono_empresa') || '',
      direccion: authService.getCurrentUser()?.direccion || '',
    };
  },

  // Obtener información SIAT
  getSiatInfo: () => {
    return {
      clave_siat: localStorage.getItem('clave_siat') || '',
      codigo_sistema: localStorage.getItem('codigo_sistema') || '',
      codigo_ambiente: localStorage.getItem('codigo_ambiente') || '2',
    };
  },

  // Obtener información del plan actual
  getPlanInfo: () => {
    return {
      nombre: localStorage.getItem('plan') || '',
      fecha_expiracion: localStorage.getItem('fecha_expiracion') || '',
    };
  },

  // Verificar si el plan está activo
  isPlanActive: () => {
    const fechaExpiracion = localStorage.getItem('fecha_expiracion');
    if (!fechaExpiracion) return false;
    
    const fechaExp = new Date(fechaExpiracion);
    const fechaActual = new Date();
    
    return fechaExp > fechaActual;
  },

  // Actualizar información del usuario en localStorage
  updateUserInfo: (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    // Actualizar campos específicos si están presentes
    if (userData.nombre_empresa !== undefined) {
      localStorage.setItem('nombre_empresa', userData.nombre_empresa || '');
    }
    if (userData.nit_empresa !== undefined) {
      localStorage.setItem('nit_empresa', userData.nit_empresa || '');
    }
    if (userData.razon_social !== undefined) {
      localStorage.setItem('razon_social', userData.razon_social || '');
    }
    if (userData.municipio !== undefined) {
      localStorage.setItem('municipio', userData.municipio || '');
    }
    if (userData.telefono_empresa !== undefined) {
      localStorage.setItem('telefono_empresa', userData.telefono_empresa || '');
    }
    if (userData.clave_siat !== undefined) {
      localStorage.setItem('clave_siat', userData.clave_siat || '');
    }
    if (userData.plan !== undefined) {
      localStorage.setItem('plan', userData.plan || '');
    }
    if (userData.fecha_expiracion !== undefined) {
      localStorage.setItem('fecha_expiracion', userData.fecha_expiracion || '');
    }
  },
  
  // Refrescar el token cuando expire
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No hay token de refresco disponible');
    
    try {
      // Usamos publicApi porque el token access ya expiró
      const response = await publicApi.post('/accounts/token/refresh/', {
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

// Mejorar la función normalizeAndSaveRole
const normalizeAndSaveRole = (userData) => {
  let roleValue = null;
  
  // Verificar si hay un rol explícito
  if (userData.rol) {
    if (typeof userData.rol === 'object' && userData.rol.nombre) {
      roleValue = userData.rol.nombre;
    } else if (typeof userData.rol === 'string') {
      roleValue = userData.rol;
    } else if (typeof userData.rol === 'number') {
      roleValue = 'admin'; // Convertir ID de rol a "admin"
    }
  }
  
  // Si es tipo 'usuario' y no hay un rol específico, asignar 'admin'
  if (userData.tipo === 'usuario' && !roleValue) {
    roleValue = 'admin';
    console.log('Asignando rol admin por defecto para usuario principal');
  }
  
  // Garantizar que siempre haya un valor válido (nunca null)
  localStorage.setItem('rol', roleValue || 'admin');
  console.log('Rol normalizado guardado:', roleValue || 'admin');
  
  return roleValue || 'admin';
};

export default authService;