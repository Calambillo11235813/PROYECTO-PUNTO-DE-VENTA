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
import Login from "./components/HomeHeader/login";
<<<<<<< HEAD
import Home from "./pages/Home/Home";
=======
import Home from "./pages/Home";
>>>>>>> origin/Diogo
import Plans from "./components/HomeHeader/plans";

// Componentes de administración
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard";
<<<<<<< HEAD
import Users from "./pages/Users/Users";
import Inventario from "./pages/Inventario/Inventario";
import Sales from "./pages/Sales/Sales"
=======


import Sales from "./pages/Sales"
import Inventario from './pages/Inventario';
>>>>>>> origin/Diogo

const Ventas = () => <div>Página de Ventas en desarrollo</div>;

const Facturacion = () => <div>Página de Facturación en desarrollo</div>;
const Reportes = () => <div>Página de Reportes en desarrollo</div>;
const Configuracion = () => <div>Página de Configuración en desarrollo</div>;

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
<<<<<<< HEAD
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas - solo para administradores */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="products" element={<Inventario />} />
                <Route path="ventas" element={<Sales />} />{" "}
                {/* Añadir cuando tengas este componente */}
                <Route path="clientes" element={<Users />} />{" "}
                {/* Añadir cuando tengas este componente */}
                <Route path="facturacion" element={<Facturacion />} />{" "}
                {/* Añadir cuando tengas este componente */}
                <Route path="reportes" element={<Reportes />} />{" "}
                {/* Añadir cuando tengas este componente */}
                <Route path="configuracion" element={<Configuracion />} />{" "}
                {/* Añadir cuando tengas este componente */}
=======


          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />



          {/* Rutas protegidas - solo para administradores */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>

              <Route path="/admin" element={<AdminLayout />}>


                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Inventario />} />{" "}
                <Route path="ventas" element={<Sales />} />{" "}
                <Route path="facturacion" element={<Facturacion />} />{" "}
                <Route path="reportes" element={<Reportes />} />{" "}
                <Route path="configuracion" element={<Configuracion />} />{" "}
>>>>>>> origin/Diogo
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
