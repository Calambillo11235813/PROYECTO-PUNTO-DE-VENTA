import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaAngleLeft, FaAngleRight, FaChartBar, FaShoppingCart, FaBoxOpen, FaUsers, FaFileInvoiceDollar, FaCog, FaSun, FaMoon, FaSignOutAlt, FaShoppingBag, FaUserTie, FaCashRegister, FaUserLock } from "react-icons/fa";
import authService from "../services/authService";
import permisoService from "../services/permisoService";

const Sidebar = ({ darkMode = false, toggleDarkMode, isOpen, toggleSidebar }) => {
  const [loading, setLoading] = useState(true);
  const [userPermisos, setUserPermisos] = useState([]);
  const navigate = useNavigate();
  
  // Obtener el ID del empleado desde localStorage
  const empleadoId = localStorage.getItem('id');
  
  // Carga de permisos optimizada
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        // Depuración adicional
        console.log("======= INICIALIZANDO SIDEBAR =======");
        console.log("empleadoId:", empleadoId);
        console.log("user_type:", localStorage.getItem('user_type'));
        console.log("rol:", localStorage.getItem('rol'));
        
        // Verificar si hay acceso token
        if (!localStorage.getItem('access_token')) {
          console.error("No se encontró token de acceso - Redirigiendo a login");
          navigate('/login');
          return;
        }
        
        // Verificar primero si es usuario administrador
        const userType = localStorage.getItem('user_type');
        
        if (userType === 'usuario') {
          // Los usuarios administradores tienen todos los permisos
          console.log("Usuario administrador detectado - asignando todos los permisos");
          setUserPermisos([
            "dashboard_acceso", "administrar_caja", "ventas_realizar", 
            "ver_lista_de_ventas", "ver_inventarios", "agregar_inventario", 
            "editar_inventario", "eliminar_inventario", "ver_clientes", 
            "agregar_cliente", "editar_cliente", "eliminar_cliente", 
            "ver_empleados", "agregar_empleados", "editar_empleado", 
            "eliminar_empleado", "facturacion_gestionar", "reportes_ver", 
            "configuracion_acceso", "roles_y_permisos", "admin_acceso_total"
          ]);
          setLoading(false);
          return;
        }
        
        // Para empleados normales, seguir con el flujo actual
        if (!empleadoId) {
          console.warn("No se encontró ID de empleado en localStorage");
          setLoading(false);
          // No redireccionar, podría haber un error, pero no bloquear la UI
          return;
        }
        
        console.log("Cargando permisos para empleado:", empleadoId);
        try {
          const permisosData = await permisoService.getPermisosEmpleado(empleadoId);
          console.log("Permisos obtenidos:", permisosData);
          
          // Convertir el resultado a un array de nombres de permisos
          if (Array.isArray(permisosData)) {
            setUserPermisos(permisosData.map(p => p.nombre));
          } else {
            console.warn("Formato de permisos inesperado:", permisosData);
            setUserPermisos([]);
          }
        } catch (permisoError) {
          console.error("Error específico al cargar permisos:", permisoError);
          setUserPermisos([]);
        }
      } catch (error) {
        console.error("Error general al cargar permisos:", error);
        setUserPermisos([]);
      } finally {
        setLoading(false);
      }
    };
    
    cargarPermisos();
  }, [empleadoId, navigate]);

  useEffect(() => {
    console.log("Modo oscuro: ", darkMode);
  }, [darkMode]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("id");
    localStorage.removeItem("rol");
    authService.logout();
    navigate("/login");
  };

  // Verificar si el usuario tiene el permiso requerido
  const tienePermiso = useCallback((permisoRequerido) => {
    // Si el usuario es de tipo "usuario" (administrador general), tiene acceso a todo
    const userType = localStorage.getItem('user_type');
    if (userType === 'usuario') return true;
    
    // Para otros tipos de usuarios, verificar permisos específicos
    if (!permisoRequerido) return true; // Si no se requiere permiso específico
    if (permisoRequerido === '*') return true; // Permiso especial que todos pueden ver
    
    // Si es usuario admin (puedes identificarlo por un permiso especial)
    if (userPermisos.includes('admin_acceso_total')) return true;
    
    // Verificar si el usuario tiene el permiso específico
    return userPermisos.includes(permisoRequerido);
  }, [userPermisos]);

  // Definir los elementos del menú con sus rutas y permisos requeridos
  const menuItems = [
    { 
      id: "Dashboard", 
      icon: <FaChartBar />, 
      text: "Dashboard", 
      path: "/admin", 
      exact: true,
      permisoRequerido: "dashboard_acceso" 
    },
    { 
      id: "Caja", 
      icon: <FaCashRegister />, 
      text: "Administrar Caja", 
      path: "/admin/caja",
      permisoRequerido: "administrar_caja"
    },
    { 
      id: "Ventas", 
      icon: <FaShoppingCart />, 
      text: "Punto de Venta", 
      path: "/admin/ventas",
      permisoRequerido: "ventas_realizar"
    },
    { 
      id: "Pedidos", 
      icon: <FaShoppingBag />, 
      text: "Lista de ventas", 
      path: "/admin/Lista_ventas",
      permisoRequerido: "ver_lista_de_ventas"
    },
    { 
      id: "Inventario", 
      icon: <FaBoxOpen />, 
      text: "Inventario", 
      path: "/admin/inventario",
      permisoRequerido: "ver_inventarios"
    },
    { 
      id: "Clientes", 
      icon: <FaUsers />, 
      text: "Clientes", 
      path: "/admin/clientes",
      permisoRequerido: "ver_clientes"
    },
    { 
      id: "Empleados", 
      icon: <FaUserTie />, 
      text: "Empleados", 
      path: "/admin/empleados",
      permisoRequerido: "ver_empleados" 
    },
    { 
      id: "Facturacion", 
      icon: <FaFileInvoiceDollar />, 
      text: "Facturación", 
      path: "/admin/facturacion",
      permisoRequerido: "facturacion_gestionar"
    },
    { 
      id: "Reportes", 
      icon: <FaChartBar />, 
      text: "Reportes", 
      path: "/admin/reportes",
      permisoRequerido: "reportes_ver" 
    },
    { 
      id: "Configuracion", 
      icon: <FaCog />, 
      text: "Configuración", 
      path: "/admin/configuracion",
      permisoRequerido: "configuracion_acceso"
    },
    { 
      id: "RolesYPermisos", 
      icon: <FaUserLock />, 
      text: "Roles y Permisos", 
      path: "/admin/roles-permisos",
      permisoRequerido: "roles_y_permisos" // Cualquier usuario autenticado tiene acceso
    },
  ];

  // Renderizado seguro de menú items
  const renderMenuItems = () => {
    try {
      return menuItems
        .filter(item => tienePermiso(item.permisoRequerido))
        .map(item => (
          <li key={item.id}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) =>
                `flex items-center px-4 py-2 mt-2 ${
                  isActive
                    ? "text-gray-800 dark:text-gray-100 bg-gradient-to-r from-yellow-300 to-yellow-200 dark:from-yellow-700 dark:to-yellow-600 rounded-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                }`
              }
            >
              {item.icon}
              <span className={`mx-4 font-medium ${!isOpen && "hidden"}`}>
                {item.text}
              </span>
            </NavLink>
          </li>
        ));
    } catch (err) {
      console.error("Error al renderizar menú:", err);
      return (
        <li className="text-red-500 px-4 py-2">
          Error al cargar menú. 
          <button 
            onClick={() => window.location.reload()}
            className="underline ml-2"
          >
            Reintentar
          </button>
        </li>
      );
    }
  };

  return (
    <aside 
      className={`${darkMode ? "bg-gray-900" : "bg-white"} ${
        isOpen ? "w-64" : "w-20"
      } h-screen fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out shadow-md`}
    >
      <div className="h-full flex flex-col">
        {/* Logo y toggle button - Reemplazando la imagen con un texto o ícono */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center">
            {/* Reemplazo del logo con una letra o ícono */}
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className={`ml-2 font-bold text-xl ${!isOpen && "hidden"}`}>
              Point of Sale
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isOpen ? <FaAngleLeft /> : <FaAngleRight />}
          </button>
        </div>

        {/* Estado de carga */}
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : null}

        {/* Menu - Usando filteredMenuItems basado en permisos */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="text-center py-4">Cargando menú...</div>
          ) : (
            <nav>
              <ul>
                {renderMenuItems()}
              </ul>
            </nav>
          )}
        </div>

        {/* Footer del sidebar */}
        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`text-sm ${!isOpen && "hidden"}`}>Tema Oscuro</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
          >
            <span className={isOpen ? "block" : "hidden"}>Cerrar Sesión</span>
            {!isOpen && "🚪"}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
