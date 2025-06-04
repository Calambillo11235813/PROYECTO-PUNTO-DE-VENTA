import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Estado para controlar el sidebar
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

  useEffect(() => {
    try {
      // Reset del contador de redirecciones si llegamos aquí correctamente
      localStorage.removeItem("redirect_count");

      // Verificar autenticación
      const token = localStorage.getItem("access_token");
      const userType = localStorage.getItem("user_type");

      console.log("AdminLayout - Verificación:", {
        token: token ? "presente" : "ausente",
        userType,
      });

      if (!token) {
        console.warn("No se encontró token de acceso - Redirigiendo a login");
        navigate("/login");
        return;
      }

      // Éxito en la carga
      setIsLoading(false);
    } catch (err) {
      console.error("Error en AdminLayout:", err);
      setError(err.message || "Error desconocido al cargar el dashboard");
      setIsLoading(false);
    }
  }, [navigate]);

  // Mostrar pantalla de error si algo falló
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">
            Error al cargar el dashboard
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-between">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Renderizado normal con posicionamiento correcto
  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      <Sidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Header si lo tienes */}
        <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              Panel de Administración
            </h1>
            {/* Botones de acción u otros elementos del header */}
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-6">
          <Outlet
            context={[darkMode, toggleDarkMode, activePage, setActivePage]}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
