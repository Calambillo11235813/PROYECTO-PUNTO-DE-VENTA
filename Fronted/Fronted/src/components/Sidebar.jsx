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
  FaCashRegister, // Nuevo icono para Caja
} from "react-icons/fa";
import authService from "../services/authService";

const Sidebar = ({ darkMode = false, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('rol');

  useEffect(() => {
    console.log("Modo oscuro: ", darkMode);
  }, [darkMode]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    authService.logout();
    navigate("/login");
  };

  // Definir los elementos del menú con sus rutas y roles permitidos
  const menuItems = [
    { 
      id: "Dashboard", 
      icon: <FaChartBar />, 
      text: "Dashboard", 
      path: "/admin", 
      exact: true,
      allowedRoles: [undefined, 'Supervisor'] 
    },
    { 
      id: "Caja", 
      icon: <FaCashRegister />, 
      text: "Administrar Caja", 
      path: "/admin/caja",
      allowedRoles: [undefined, 'Supervisor', 'Cajero']
    },
    { 
      id: "Ventas", 
      icon: <FaShoppingCart />, 
      text: "Punto de Venta", 
      path: "/admin/ventas",
      allowedRoles: [undefined, 'Supervisor', 'Cajero']
    },
    { 
      id: "Pedidos", 
      icon: <FaShoppingBag />, 
      text: "Lista de ventas", 
      path: "/admin/pedidos",
      allowedRoles: [undefined, 'Supervisor', 'Cajero']
    },
    { 
      id: "Inventario", 
      icon: <FaBoxOpen />, 
      text: "Inventario", 
      path: "/admin/inventario",
      allowedRoles: [undefined, 'Supervisor', 'Gestion de inventario']
    },
    { 
      id: "Empleados", 
      icon: <FaUserTie />, 
      text: "Empleados", 
      path: "/admin/empleados",
      allowedRoles: [undefined]
    },
    { 
      id: "Facturacion", 
      icon: <FaFileInvoiceDollar />, 
      text: "Facturación", 
      path: "/admin/facturacion",
      allowedRoles: [undefined, 'Supervisor']
    },
    { 
      id: "Reportes", 
      icon: <FaChartBar />, 
      text: "Reportes", 
      path: "/admin/reportes",
      allowedRoles: [undefined, 'Supervisor'] 
    },
    { 
      id: "Configuracion", 
      icon: <FaCog />, 
      text: "Configuración", 
      path: "/admin/configuracion",
      allowedRoles: [undefined]
    },
  ];

  // Filtrar los elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => {
    // Si no se especifican roles permitidos o el ítem permite cualquier rol
    if (!item.allowedRoles) return true;
    
    // Si el rol es undefined (superusuario), mostrar todo
    if (!userRole) return true;
    
    // Verificar si el rol del usuario está en los roles permitidos del ítem
    return item.allowedRoles.includes(userRole);
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

      {/* Menu - MODIFICADO para usar filteredMenuItems */}
      <nav className="flex-1 overflow-y-auto mt-2">
        {filteredMenuItems.map((item) => (
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
        ))}
      </nav>

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
