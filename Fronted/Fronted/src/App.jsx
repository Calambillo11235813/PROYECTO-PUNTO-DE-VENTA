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

// Componentes de empleados
import Empleados from './pages/Empleados/Empleados';
import EmpleadoForm from './pages/Empleados/EmpleadoForm';

// Nuevo import para el componente de Roles y Permisos
import RolesYPermisos from './pages/RolesYPermisos';

// Componente para acceso denegado
const AccesoDenegado = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div className="p-8 bg-white rounded-lg shadow-md">Según el código de Sidebar.jsx que has compartido, un usuario con rol "Cajero" debería tener acceso a las opciones "Administrar Caja" y "Clientes", ya que están configuradas correctamente en los allowedRoles. El problema podría estar relacionado con alguna de estas causas:
    
    Posibles causas:
    Caso en el texto del rol: El sistema podría estar guardando el rol con una capitalización diferente (por ejemplo, "cajero" en lugar de "Cajero").
    
    Problema de validación adicional: Aunque el menú muestre las opciones, podría haber validaciones adicionales en las rutas.
    
    Problema en localStorage: El valor del rol podría no estar guardándose correctamente.
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-gray-700 mb-4">No tienes permisos para acceder a esta sección.</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

const Facturacion = () => <div>Página de Facturación en desarrollo</div>;
const Reportes = () => <div>Página de Reportes en desarrollo</div>;

function App() {
  return (
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
                <Route path="reportes" element={<Reportes />} />
                <Route path="configuracion" element={<Configuracion />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="caja" element={<CajaManager />} />
                <Route path="roles-permisos" element={<RolesYPermisos />} /> {/* Nueva ruta añadida */}
              </Route>
            </Route>
          </Route>

          {/* Ruta para redireccionar URLs no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
