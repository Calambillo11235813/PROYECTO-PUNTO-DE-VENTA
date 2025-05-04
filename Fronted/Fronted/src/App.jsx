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
import Plans from "./components/HomeHeader/Plans";

// Componentes de administración
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard";

// Páginas de la aplicación
import Sales from "./pages/Sales";
import Inventario from './pages/Inventario';
import Pedidos from './pages/Pedidos'; 
import Configuracion from './pages/Configuracion'; // Importar el nuevo componente de configuración

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

          {/* Rutas protegidas - solo para administradores */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="ventas" element={<Sales />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="facturacion" element={<Facturacion />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="configuracion" element={<Configuracion />} /> {/* Usar el nuevo componente */}
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
