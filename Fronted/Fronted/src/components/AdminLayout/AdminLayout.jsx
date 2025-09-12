import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useAuth } from "../Contexts/AuthContext";

import {
  FaBars,
  FaChartBar,
  FaShoppingCart,
  FaUsers,
  FaCog,
  FaFileAlt,
  FaChartPie,
  FaBox,
  FaUserTie, // Nuevo ícono para Empleados
} from "react-icons/fa";


import "./AdminLayout.css";

const AdminLayout = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");

  // Efecto para aplicar el modo oscuro a nivel global
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Función para cambiar el modo oscuro
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    console.log("Cambiando a modo:", newMode ? "oscuro" : "claro");
    setDarkMode(newMode);
  };

  // Función para toggle del sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para determinar qué icono mostrar según la página activa
  const getPageIcon = () => {
    switch (activePage) {
      case "Dashboard":
        return <FaChartBar size={24} />;
      case "Gestión de Inventario":
        return <FaBox size={24} />;
      case "Ventas":
        return <FaShoppingCart size={24} />;
      case "Empleados":
        return <FaUserTie size={24} />;
      case "Clientes":
        return <FaUsers size={24} />;
      case "Facturación":
        return <FaFileAlt size={24} />;
      case "Reportes":
        return <FaChartPie size={24} />;
      case "Configuración":
        return <FaCog size={24} />;
      default:
        return <FaChartBar size={24} />;
    }
  };

  return (
    <div className={`admin-layout ${darkMode ? "dark-mode" : ""}`}>
      <Sidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className={`admin-content ${sidebarOpen ? "" : "expanded"}`}>
        <header className="admin-header">
          <div className="left">
            <div className="page-title">
              {getPageIcon()}
              <h1>{activePage}</h1>
            </div>
          </div>
        </header>
        <main className={`admin-main ${darkMode ? "dark-mode" : ""}`}>
          <Outlet
            context={[darkMode, toggleDarkMode, activePage, setActivePage]}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
