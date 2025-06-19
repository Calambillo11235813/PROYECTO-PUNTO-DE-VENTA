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
  FaStar, // Reemplazar FaSparkles por FaStar
  FaPalette,
} from "react-icons/fa";
import authService from "../services/authService";

const defaultPalette = {
  "--bg-primary": "#f8f9fa",
  "--bg-secondary": "#e9ecef",
  "--bg-tertiary": "#ffffff",
  "--text-primary": "#2d3748",
  "--text-secondary": "#2d3748",
  "--accent-color": "#45a049",
  "--header-bg": "#ffffff",
};

const Sidebar = ({ darkMode = false, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [palette, setPalette] = useState(defaultPalette);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("rol");

  useEffect(() => {
    const stored = localStorage.getItem("custom-palette");
    if (stored) {
      const parsed = JSON.parse(stored);
      setPalette(parsed);
      applyPalette(parsed);
    }
  }, []);

  const applyPalette = (palette) => {
    Object.entries(palette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  const handleColorChange = (e, variable) => {
    const newPalette = { ...palette, [variable]: e.target.value };
    setPalette(newPalette);
  };

  const savePalette = () => {
    localStorage.setItem("custom-palette", JSON.stringify(palette));
    applyPalette(palette);
  };

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
      icon: <FaStar className="h-5 w-5" />, // Usar FaStar en lugar de FaSparkles
      text: "Mi Plan", 
      path: "/admin/mi-plan",
      allowedRoles: [undefined, 'Supervisor'] 
    },
    { id: "Dashboard", icon: <FaChartBar />, text: "Dashboard", path: "/admin", exact: true, allowedRoles: [undefined, "Supervisor"] },
    { id: "Caja", icon: <FaCashRegister />, text: "Administrar Caja", path: "/admin/caja", allowedRoles: [undefined, "Supervisor", "Cajero"] },
    { id: "Ventas", icon: <FaShoppingCart />, text: "Punto de Venta", path: "/admin/ventas", allowedRoles: [undefined, "Supervisor", "Cajero"] },
    { id: "Pedidos", icon: <FaShoppingBag />, text: "Lista de ventas", path: "/admin/Lista_ventas", allowedRoles: [undefined, "Supervisor", "Cajero"] },
    { id: "Inventario", icon: <FaBoxOpen />, text: "Inventario", path: "/admin/inventario", allowedRoles: [undefined, "Supervisor", "Gestion de inventario"] },
    { id: "Clientes", icon: <FaUsers />, text: "Clientes", path: "/admin/clientes", allowedRoles: [undefined, "Supervisor", "Cajero"] },
    { id: "Empleados", icon: <FaUserTie />, text: "Empleados", path: "/admin/empleados", allowedRoles: [undefined, "Supervisor"] },
    { id: "Facturacion", icon: <FaFileInvoiceDollar />, text: "Facturación", path: "/admin/facturacion", allowedRoles: [undefined, "Supervisor"] },
    { id: "Reportes", icon: <FaChartBar />, text: "Reportes", path: "/admin/reportes", allowedRoles: [undefined, "Supervisor"] },
    { id: "Configuracion", icon: <FaCog />, text: "Configuración", path: "/admin/configuracion", allowedRoles: [undefined, "Supervisor"] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.allowedRoles) return true;
    if (!userRole) return true;
    return item.allowedRoles.includes(userRole);
  });

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${isOpen ? "w-64" : "w-20"} border-r flex flex-col`}
      style={{ backgroundColor: "var(--bg-secondary)", color: darkMode ? "white" : "black" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b title-icon">
        {isOpen && <h2 className="text-xl font-bold">POS System</h2>}
        <button onClick={toggleSidebar} className="text-lg focus:outline-none">☰</button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-2">
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
            >
              <div className="text-lg">{item.icon}</div>
              {isOpen && <span className="ml-3 truncate">{item.text}</span>}
            </NavLink>
          ))}
        </nav>

{/* Paleta de Colores */}
{isOpen && (
  <div className="px-6 py-4 space-y-2 border-t">
    <div className="flex items-center gap-2">
      <FaPalette /> <span>Paleta de Colores</span>
    </div>

    {/* Variables de color con nombres descriptivos */}
    {Object.entries(palette).map(([key, value]) => {
      const colorNames = {
        "--bg-primary": "Color de fondo",                   // #f8f9fa
        "--bg-secondary": "Color de sidebar",              // #e9ecef
        "--bg-tertiary": "Color de objetos",               // #ffffff
        "--text-primary": "Color de letra títulos",        // #2d3748
        "--text-secondary": "Color de letra en general",   // #2d3748
        "--accent-color": "Color de iconos",               // #45a049
        "--header-bg": "Color del navbar",                 // #ffffff
      };

      return (
        <div key={key} className="flex items-center justify-between">
          <label className="text-sm">{colorNames[key] || key}</label>
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e, key)}
            className="w-10 h-6 rounded"
          />
        </div>
      );
    })}

    <button
      onClick={savePalette}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-sm"
    >
      Guardar Paleta
    </button>
  </div>
)}

      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 space-y-3">
        <button onClick={toggleDarkMode} className="flex items-center w-full text-left focus:outline-none">
          {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
          {isOpen && <span className="ml-3">{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>}
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
