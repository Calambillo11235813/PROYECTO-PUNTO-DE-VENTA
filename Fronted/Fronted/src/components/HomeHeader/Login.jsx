import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import authService from "../../services/authService";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("usuario"); // 'usuario' o 'empleado'
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const testConn = async () => {
      try {
        await authService.testConnection();
      } catch (error) {
        console.error("Fallo en prueba de conexión" + error);
      }
    };

    testConn();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const response = await authService.login(correo, contrasena);
      
      // Determinar el tipo de usuario según la respuesta
      const isEmployee = response.tipo === "empleado";
      
      if (isEmployee) {
        // Procesar datos del empleado
        const userData = {
          ...response.empleado,
          id: response.empleado.id,
          nombre: response.empleado.nombre,
          correo: response.empleado.correo,
          rol: response.empleado.rol,
          is_empleado: true,
          tipo: "empleado"
        };
        
        console.log("Empleado autenticado:", userData);
        login(userData);
        
        // Redirigir según el rol del empleado
        if (response.empleado.rol === "Supervisor") {
          navigate("/admin");
        } else if (response.empleado.rol === "Cajero") {
          navigate("/pos");
        } else if (response.empleado.rol === "Gestor de Inventario") {
          navigate("/inventario");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Procesar datos de usuario administrador
        const userData = {
          ...response.usuario,
          id: response.usuario.id,
          nombre: response.usuario.nombre,
          correo: response.usuario.correo,
          rol: response.usuario.rol || { 
            id: 1, 
            nombre: "admin" 
          },
          is_staff: response.usuario.is_staff,
          tipo: "usuario"
        };
        
        console.log("Usuario autenticado:", userData);
        login(userData);
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Iniciar Sesión</h1>
        
        <div className="flex justify-center mb-4">
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              className={`px-4 py-2 text-sm ${
                loginType === 'usuario'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setLoginType('usuario')}
            >
              Administrador
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm ${
                loginType === 'empleado'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setLoginType('empleado')}
            >
              Empleado
            </button>
          </div>
        </div>
        
        <p className="text-gray-500 text-center mb-6 text-sm">
          {loginType === 'usuario' 
            ? 'Acceso para administradores del sistema' 
            : 'Acceso para personal y empleados'}
        </p>

        <div className="mb-4 relative">
          <label htmlFor="correo" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Correo electrónico</label>
          <input
            type="email"
            id="correo"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ejemplo@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-4 relative">
          <label htmlFor="contrasena" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error && <div className="text-red-500 text-center text-sm mb-4">{error}</div>}

        <button 
          type="submit" 
          className="w-full bg-green-500 text-white py-3 rounded-md text-sm font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        >
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

        <div className="text-center mt-4 text-sm text-gray-500">
          <a href="#" className="text-green-500 hover:underline">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  );
}
