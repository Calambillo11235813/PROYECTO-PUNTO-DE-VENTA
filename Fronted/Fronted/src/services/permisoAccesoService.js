import permisoService from './permisoService';
import rolService from './rolService';

const permisoAccesoService = {
  // Mapeo de permisos a rutas
  permisosRutas: {
    'ver_dashboard': ['/admin'],
    'ver_inventario': ['/admin/inventario'],
    'editar_inventario': ['/admin/inventario/editar'],
    'ver_ventas': ['/admin/ventas'],
    'realizar_ventas': ['/admin/ventas'],
    'ver_lista_ventas': ['/admin/Lista_ventas'],
    'gestionar_pedidos': ['/admin/pedidos'],
    'ver_clientes': ['/admin/clientes'],
    'editar_clientes': ['/admin/clientes/editar'],
    'gestionar_caja': ['/admin/caja'],
    'ver_empleados': ['/admin/empleados'],
    'editar_empleados': ['/admin/empleados/crear', '/admin/empleados/editar'],
    'ver_facturacion': ['/admin/facturacion'],
    'ver_reportes': ['/admin/reportes'],
    'configurar_sistema': ['/admin/configuracion'],
    'gestionar_roles': ['/admin/roles'],
    // Añade más mapeos según sea necesario
  },

  // Cache para almacenar permisos por rol
  permisosCache: {},

  // Obtener permisos para un usuario específico
  obtenerPermisosUsuario: async (usuarioId, rolId) => {
    try {
      // Verificar si es usuario principal (no empleado)
      const userType = localStorage.getItem('user_type');
      if (userType === 'usuario') {
        console.log('Usuario principal detectado: acceso total concedido');
        // Devolver todos los permisos posibles
        return Object.keys(permisoAccesoService.permisosRutas);
      }

      // Para empleados, seguir con la verificación normal de permisos
      // Primero verificamos si tenemos los permisos de ese rol en cache
      if (permisoAccesoService.permisosCache[rolId]) {
        return permisoAccesoService.permisosCache[rolId];
      }

      // Si no está en cache, obtenemos los permisos del rol desde la API
      const rolData = await rolService.getRolById(rolId);
      
      if (!rolData || !rolData.permisos) {
        console.error('No se pudieron obtener los permisos del rol');
        return [];
      }

      // Obtenemos los nombres de los permisos
      const permisosData = await rolService.getRolPermisos(rolId);
      const permisosNombres = permisosData.permisos.map(p => p.nombre);
      
      // Guardamos en cache
      permisoAccesoService.permisosCache[rolId] = permisosNombres;
      
      return permisosNombres;
    } catch (error) {
      console.error('Error al obtener permisos del usuario:', error);
      return [];
    }
  },

  // Verificar si un usuario tiene acceso a una ruta específica
  verificarAccesoRuta: async (usuarioId, rolId, ruta) => {
    try {
      // Verificar si es usuario principal (no empleado)
      const userType = localStorage.getItem('user_type');
      if (userType === 'usuario') {
        console.log('Usuario principal: acceso a ruta concedido automáticamente');
        return true; // Acceso total para el usuario principal
      }

      // Si no hay usuario o rol, denegamos acceso
      if (!usuarioId || !rolId) {
        return false;
      }

      // Caso especial: superadmin tiene acceso a todo
      const superAdmin = localStorage.getItem('is_superadmin') === 'true';
      if (superAdmin) {
        return true;
      }

      // Obtenemos los permisos del usuario (empleado)
      const permisos = await permisoAccesoService.obtenerPermisosUsuario(usuarioId, rolId);
      
      // Verificamos cada permiso y si alguno concede acceso a la ruta
      for (const permiso of permisos) {
        const rutasPermitidas = permisoAccesoService.permisosRutas[permiso] || [];
        
        // Si el permiso da acceso directo a la ruta
        if (rutasPermitidas.includes(ruta)) {
          return true;
        }
        
        // Si el permiso da acceso a una ruta padre
        if (rutasPermitidas.some(rutaPermitida => 
            ruta.startsWith(rutaPermitida + '/') || rutaPermitida === ruta)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar acceso:', error);
      return false;
    }
  },

  // Obtener todas las rutas permitidas para un usuario
  obtenerRutasPermitidas: async (usuarioId, rolId) => {
    try {
      // Verificar si es usuario principal
      const userType = localStorage.getItem('user_type');
      if (userType === 'usuario') {
        console.log('Usuario principal: todas las rutas permitidas');
        return ['*']; // Indicador de acceso total
      }

      // Si es superadmin, tiene acceso a todas las rutas
      const superAdmin = localStorage.getItem('is_superadmin') === 'true';
      if (superAdmin) {
        return ['*']; // Acceso a todo
      }

      // Obtenemos los permisos del usuario (empleado)
      const permisos = await permisoAccesoService.obtenerPermisosUsuario(usuarioId, rolId);
      
      // Obtenemos las rutas permitidas para cada permiso
      const rutasPermitidas = [];
      for (const permiso of permisos) {
        const rutas = permisoAccesoService.permisosRutas[permiso] || [];
        rutasPermitidas.push(...rutas);
      }
      
      // Eliminamos duplicados
      return [...new Set(rutasPermitidas)];
    } catch (error) {
      console.error('Error al obtener rutas permitidas:', error);
      return [];
    }
  }
};

export default permisoAccesoService;