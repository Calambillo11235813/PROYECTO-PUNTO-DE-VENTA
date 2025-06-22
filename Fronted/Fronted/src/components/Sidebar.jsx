import React, { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
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
  FaStar,
  FaPalette,
  FaChevronDown,
  FaChevronUp,
  FaUndoAlt  // Añadido icono para restablecer
} from "react-icons/fa";
import authService from "../services/authService";
import useTheme from "../hooks/useTheme";

const Sidebar = ({ darkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("rol");
  
  // Incluir resetPalette en las funciones extraídas del hook
  const { 
    palette, 
    handleColorChange, 
    savePalette, 
    resetPalette,  // Añadida esta función
    colorNames 
  } = useTheme();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Función para alternar la visibilidad de la paleta de colores
  const togglePalette = () => {
    setIsPaletteOpen(!isPaletteOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    authService.logout();
    navigate("/login");
  };

  // Definición unificada de elementos del menú
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
      path: "/admin/Lista_ventas",
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
      id: "Clientes", 
      icon: <FaUsers />, 
      text: "Clientes", 
      path: "/admin/clientes",
      allowedRoles: [undefined, 'Supervisor', 'Cajero']
    },
    { 
      id: "Empleados", 
      icon: <FaUserTie />, 
      text: "Empleados", 
      path: "/admin/empleados",
      allowedRoles: [undefined, 'Supervisor'] 
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
      allowedRoles: [undefined, 'Supervisor']
    },
    { 
      id: "MiPlan", 
      icon: <FaStar className="h-5 w-5" />,
      text: "Mi Plan", 
      path: "/admin/mi-plan",
      allowedRoles: [undefined, 'Supervisor'] 
    },
  ];

  // Memoizar el filtrado de elementos para evitar recálculos innecesarios
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.allowedRoles) return true;
      if (!userRole) return true;
      return item.allowedRoles.includes(userRole);
    });
  }, [userRole, menuItems]);

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${isOpen ? "w-64" : "w-20"} border-r flex flex-col`}
      style={{ backgroundColor: "var(--bg-secondary)", color: darkMode ? "white" : "black" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b title-icon">
        {isOpen && <h2 className="text-xl font-bold">POS System</h2>}
        <button 
          onClick={toggleSidebar} 
          className="text-lg focus:outline-none"
          aria-label={isOpen ? "Contraer menú" : "Expandir menú"}
        >
          ☰
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-2" aria-label="Menú principal">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition-all ${
                  isActive ? "bg-blue-100 text-blue-600 border-l-4 border-blue-600" : "hover:bg-gray-100"
                }`
              }
              aria-label={item.text}
            >
              {/* Aplicar color de acento al contenedor del icono */}
              <div className="text-lg" aria-hidden="true" style={{ color: "var(--accent-color)" }}>
                {item.icon}
              </div>
              {isOpen && <span className="ml-3 truncate">{item.text}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Paleta de Colores - Ahora con comportamiento colapsable */}
        {isOpen && (
          <div className="px-6 py-4 border-t">
            {/* Encabezado clickeable para mostrar/ocultar la paleta */}
            <button 
              onClick={togglePalette}
              className="flex items-center justify-between w-full text-left focus:outline-none mb-2"
              aria-expanded={isPaletteOpen}
              aria-controls="color-palette-section"
            >
              <div className="flex items-center gap-2">
                <FaPalette aria-hidden="true" style={{ color: "var(--accent-color)" }} /> 
                <span>Paleta de Colores</span>
              </div>
              {isPaletteOpen ? 
                <FaChevronUp className="text-sm" /> : 
                <FaChevronDown className="text-sm" />
              }
            </button>
            
            {/* Contenido de la paleta que se muestra/oculta */}
            <div 
              id="color-palette-section"
              className={`space-y-2 overflow-hidden transition-all duration-300 ${
                isPaletteOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {/* Variables de color con nombres descriptivos */}
              {Object.entries(palette).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm" htmlFor={`color-${key}`}>
                    {colorNames[key] || key}
                  </label>
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(e, key)}
                    className="w-10 h-6 rounded"
                    aria-label={`Seleccionar ${colorNames[key] || key}`}
                  />
                </div>
              ))}

              {/* Botones de acción para la paleta */}
              <div className="flex flex-col space-y-2 mt-3">
                <button
                  onClick={savePalette}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-sm flex items-center justify-center"
                  aria-label="Guardar configuración de colores"
                >
                  Guardar Paleta
                </button>
                
                {/* Nuevo botón para restablecer a valores predeterminados */}
                <button
                  onClick={resetPalette}
                  className="w-full border border-gray-400 hover:bg-gray-100 py-1 px-2 rounded text-sm flex items-center justify-center gap-1"
                  aria-label="Restablecer a colores predeterminados"
                >
                  <FaUndoAlt className="text-xs" /> Predeterminado
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 space-y-3">
        <button 
          onClick={toggleDarkMode} 
          className="flex items-center w-full text-left focus:outline-none"
          aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? (
            <FaSun className="text-lg" aria-hidden="true" />
          ) : (
            <FaMoon className="text-lg" aria-hidden="true" />
          )}
          {isOpen && (
            <span className="ml-3">
              {darkMode ? "Modo Claro" : "Modo Oscuro"}
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left text-red-600 hover:text-red-800 focus:outline-none"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt className="text-lg" aria-hidden="true" />
          {isOpen && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

// Validación de propiedades
Sidebar.propTypes = {
  darkMode: PropTypes.bool,
  toggleDarkMode: PropTypes.func.isRequired,
};

Sidebar.defaultProps = {
  darkMode: false,
};

export default Sidebar;

// Eliminar la entrada de colorNames relacionada con --bg-report-section
const colorNames = {
  "--bg-primary": "Color de fondo",
  "--bg-secondary": "Color de sidebar",
  "--bg-tertiary": "Color de objetos",
  // Eliminar esta línea: "--bg-report-section": "Color de secciones en reportes",
  "--text-primary": "Color de letra títulos",
  "--text-secondary": "Color de letra en general",
  "--accent-color": "Color de iconos",
  "--header-bg": "Color del navbar",
};
