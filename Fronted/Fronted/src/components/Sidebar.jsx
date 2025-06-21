import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaShoppingCart,
  FaBoxOpen,
  FaUsers,
  FaFileInvoiceDollar,
  FaCog,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaShoppingBag,
  FaUserTie,
  FaCashRegister,
  FaUserShield
} from "react-icons/fa";
import authService from "../services/authService";
import permisoAccesoService from "../services/permisoAccesoService";

const Sidebar = ({ darkMode = false, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const navigate = useNavigate();
  
  const usuarioId = localStorage.getItem('id');
  const rolId = localStorage.getItem('rol_id');
  const isSuperAdmin = localStorage.getItem('is_superadmin') === 'true';
  const userType = localStorage.getItem('user_type');
  const isUsuarioPrincipal = userType === 'usuario';

  useEffect(() => {
    const cargarPermisos = async () => {
      if (isUsuarioPrincipal) {
        // Usuario principal tiene todos los permisos
        setCargandoPermisos(false);
        setPermisosUsuario(Object.keys(permisoAccesoService.permisosRutas));
        return;
      }
      
      if (!usuarioId || !rolId) {
        setCargandoPermisos(false);
        return;
      }
      
      try {
        // Obtener permisos del usuario (empleado)
        const permisos = await permisoAccesoService.obtenerPermisosUsuario(usuarioId, rolId);
        setPermisosUsuario(permisos);
      } catch (error) {
        console.error('Error al cargar permisos:', error);
      } finally {
        setCargandoPermisos(false);
      }
    };
    
    cargarPermisos();
  }, [usuarioId, rolId, isUsuarioPrincipal]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    authService.logout();
    navigate("/login");
  };

  // Verificar si el usuario tiene un permiso específico
  const tienePermiso = (permisoRequerido) => {
    return isUsuarioPrincipal || isSuperAdmin || permisosUsuario.includes(permisoRequerido);
  };

  // Definir los elementos del menú con sus permisos requeridos
  const menuItems = [
    { 
      id: "Dashboard", 
      icon: <FaChartBar />, 
      text: "Dashboard", 
      path: "/admin", 
      exact: true,
      permisoRequerido: 'ver_dashboard'
    },
    { 
      id: "Caja", 
      icon: <FaCashRegister />, 
      text: "Administrar Caja", 
      path: "/admin/caja",
      permisoRequerido: 'gestionar_caja'
    },
    { 
      id: "Ventas", 
      icon: <FaShoppingCart />, 
      text: "Punto de Venta", 
      path: "/admin/ventas",
      permisoRequerido: 'realizar_ventas'
    },
    { 
      id: "Pedidos", 
      icon: <FaShoppingBag />, 
      text: "Lista de ventas", 
      path: "/admin/Lista_ventas",
      permisoRequerido: 'ver_lista_ventas'
    },
    { 
      id: "Inventario", 
      icon: <FaBoxOpen />, 
      text: "Inventario", 
      path: "/admin/inventario",
      permisoRequerido: 'ver_inventario'
    },
    { 
      id: "Clientes", 
      icon: <FaUsers />, 
      text: "Clientes", 
      path: "/admin/clientes",
      permisoRequerido: 'ver_clientes'
    },
    { 
      id: "Empleados", 
      icon: <FaUserTie />, 
      text: "Empleados", 
      path: "/admin/empleados",
      permisoRequerido: 'ver_empleados'
    },
    { 
      id: "Facturacion", 
      icon: <FaFileInvoiceDollar />, 
      text: "Facturación", 
      path: "/admin/facturacion",
      permisoRequerido: 'ver_facturacion'
    },
    { 
      id: "Reportes", 
      icon: <FaChartBar />, 
      text: "Reportes", 
      path: "/admin/reportes",
      permisoRequerido: 'ver_reportes'
    },
    { 
      id: "Configuracion", 
      icon: <FaCog />, 
      text: "Configuración", 
      path: "/admin/configuracion",
      permisoRequerido: 'configurar_sistema'
    },
    { 
      id: "Roles", 
      icon: <FaUserShield />, 
      text: "Gestión de Roles", 
      path: "/admin/roles",
      permisoRequerido: 'gestionar_roles'
    },
  ];

  // Filtrar los elementos del menú según los permisos del usuario
  const filteredMenuItems = menuItems.filter(item => {
    // Si es usuario principal o superadmin, mostrar todo
    if (isUsuarioPrincipal || isSuperAdmin) return true;
    
    // Si está cargando permisos, no mostrar nada todavía
    if (cargandoPermisos) return false;
    
    // Verificar si el usuario tiene el permiso requerido
    return !item.permisoRequerido || tienePermiso(item.permisoRequerido);
  });

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"} border-r`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        {isOpen && <h2 className="text-xl font-bold text-blue-600">POS System</h2>}
        <button onClick={toggleSidebar} className="text-lg focus:outline-none">
          ☰
        </button>
      </div>

      {/* Menu - Ahora basado en permisos o tipo de usuario */}
      <nav className="flex-1 overflow-y-auto mt-2">
        {cargandoPermisos ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          filteredMenuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition-all ${
                  isActive
                    ? "bg-blue-100 text-blue-600 border-l-4 border-blue-600"
                    : "hover:bg-gray-100"
                }`
              }
            >
              <div className="text-lg">{item.icon}</div>
              {isOpen && <span className="ml-3 truncate">{item.text}</span>}
            </NavLink>
          ))
        )}
      </nav>

      {/* Usuario y tipo */}
      {isOpen && (
        <div className="px-6 py-2 border-t">
          <div className="text-sm text-gray-500">
            {isUsuarioPrincipal ? 'Usuario Principal' : 'Empleado'}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t px-6 py-4 space-y-3">
        <button
          onClick={toggleDarkMode}
          className="flex items-center w-full text-left focus:outline-none"
        >
          {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
          {isOpen && (
            <span className="ml-3">
              {darkMode ? "Modo Claro" : "Modo Oscuro"}
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left text-red-600 hover:text-red-800 focus:outline-none"
        >
          <FaSignOutAlt className="text-lg" />
          {isOpen && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
