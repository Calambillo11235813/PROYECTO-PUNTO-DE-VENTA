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
} from "react-icons/fa";

const Sidebar = ({ darkMode = false, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

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
    navigate("/login");
  };

  const menuItems = [
    { id: "Dashboard", icon: <FaChartBar />, text: "Dashboard", path: "/admin", exact: true },
    { id: "Ventas", icon: <FaShoppingCart />, text: "Ventas", path: "/admin/ventas" },
    { id: "Inventario", icon: <FaBoxOpen />, text: "Inventario", path: "/admin/inventario" },
    { id: "Clientes", icon: <FaUsers />, text: "Clientes", path: "/admin/clientes" },
    { id: "Facturacion", icon: <FaFileInvoiceDollar />, text: "Facturación", path: "/admin/facturacion" },
    { id: "Reportes", icon: <FaChartBar />, text: "Reportes", path: "/admin/reportes" },
    { id: "Configuracion", icon: <FaCog />, text: "Configuración", path: "/admin/configuracion" },
  ];

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

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto mt-2">
        {menuItems.map((item) => (
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
