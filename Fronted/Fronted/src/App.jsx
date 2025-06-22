// Modificar archivo: src/App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/Contexts/AuthContext";
import {
  ProtectedRoute,
  AdminRoute,
} from "./components/ProtectedRoute/ProctectedRoute";

// Importar ThemeProvider y estilos de tema
import ThemeProvider from "./context/ThemeProvider";
import "./styles/theme.css";

// Componentes públicos
import Header from "./components/HomeHeader/Homeheader";
import Register from './components/HomeHeader/Register';
import Login from "./components/HomeHeader/Login";
import Home from "./pages/Home";
import Plans from "./components/HomeHeader/Planes/Plans";

// Componentes de administración
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard";

// Páginas de la aplicación
import Sales from "./pages/Sales";
import Inventario from './pages/Inventario/Inventario';
import Configuracion from './pages/Configuracion';
import Lista_ventas from './pages/Lista_ventas';
import Clientes from './pages/Clientes/Clientes';
import CajaManager from './pages/CajaManager';
import PlanManager from "./pages/PlanManager";
import Vistareportes from './pages/Reportes/Vistareportes'; // Importamos el componente de reportes

// Componentes de empleados
import Empleados from './pages/Empleados/Empleados';
import EmpleadoForm from './pages/Empleados/EmpleadoForm';

// Componente para acceso denegado
const AccesoDenegado = () => (
  <div className="flex flex-col items-center justify-center min-h-screen theme-bg-primary">
    <div className="p-8 theme-bg-tertiary rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="theme-text-secondary mb-4">No tienes permisos para acceder a esta sección.</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 theme-accent-bg text-white rounded hover:bg-opacity-90"
      >
        Volver
      </button>
    </div>
  </div>
);

const Facturacion = () => (
  <div className="theme-bg-primary theme-text-primary p-8">
    Página de Facturación en desarrollo
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <Home />
                </>
              }
            />
            <Route
              path="/planes"
              element={
                <>
                  <Header />
                  <Plans />
                </>
              }
            />

            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Ruta de acceso denegado */}
            <Route path="/acceso-denegado" element={<AccesoDenegado />} />

            {/* Rutas protegidas - solo para administradores */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventario" element={<Inventario />} />
                  <Route path="ventas" element={<Sales />} />
                  <Route path="Lista_ventas" element={<Lista_ventas/>} />
                  <Route path="empleados" element={<Empleados />} />
                  <Route path="empleados/crear" element={<EmpleadoForm />} />
                  <Route path="empleados/editar/:id" element={<EmpleadoForm />} />
                  <Route path="facturacion" element={<Facturacion />} />
                  <Route path="reportes" element={<Vistareportes />} />
                  <Route path="configuracion" element={<Configuracion />} />
                  <Route path="clientes" element={<Clientes />} />
                  <Route path="caja" element={<CajaManager />} />
                  <Route path="mi-plan" element={<PlanManager />} />
                </Route>
              </Route>
            </Route>

            {/* Ruta para redireccionar URLs no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
