import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
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
import "./Sidebar.css";

const Sidebar = ({ darkMode = false, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    console.log("Modo oscuro: ", darkMode);
  }, [darkMode]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    console.log("Cerrando sesión");
  };

  const menuItems = [
    { id: "Dashboard", icon: <FaChartBar className="icon" />, text: "Dashboard", path: "/admin", exact: true },
    { id: "Ventas", icon: <FaShoppingCart className="icon" />, text: "Ventas", path: "/admin/ventas" },
    { id: "Inventario", icon: <FaBoxOpen className="icon" />, text: "Inventario", path: "/admin/products" },
    { id: "Clientes", icon: <FaUsers className="icon" />, text: "Clientes", path: "/admin/clientes" },
    { id: "Facturacion", icon: <FaFileInvoiceDollar className="icon" />, text: "Facturación", path: "/admin/facturacion" },
    { id: "Reportes", icon: <FaChartBar className="icon" />, text: "Reportes", path: "/admin/reportes" },
    { id: "Configuracion", icon: <FaCog className="icon" />, text: "Configuración", path: "/admin/configuracion" },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <h2>POS System</h2>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => (isActive ? "menu-item active" : "menu-item")}
            end={item.exact}
          >  
            {item.icon}
            <span className="text">{item.text}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? <FaSun className="icon" /> : <FaMoon className="icon" />}
          <span className="text">{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>
        <a href="#" className="menu-item" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span className="text">Cerrar Sesión</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;