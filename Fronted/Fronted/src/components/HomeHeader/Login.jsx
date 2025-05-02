import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import authService from "../../services/authService";
<<<<<<< HEAD
=======
<<<<<<< HEAD
import "./Login.css";
=======
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
      // Llamar al servicio de autenticación
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
      const response = await authService.login(correo, contrasena);
  
      const userData = {
        ...response.usuario,
        id: response.usuario.id,
        nombre: response.usuario.nombre,
        correo: response.usuario.correo,
<<<<<<< HEAD
=======
        // Asegurar que rol tiene una estructura consistente
=======
      const response = await authService.login(correo, contrasena);
  
      const userData = {
        ...response.usuario,
        id: response.usuario.id,
        nombre: response.usuario.nombre,
        correo: response.usuario.correo,
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
        rol: response.usuario.rol || { 
          id: 1, 
          nombre: "admin" 
        },
<<<<<<< HEAD
=======
<<<<<<< HEAD
        // Preservar cualquier otro dato (is_staff, estado, etc.)
=======
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
        is_staff: response.usuario.is_staff
      };
  
      console.log("Usuario autenticado:", userData);
<<<<<<< HEAD
      login(userData);
=======
<<<<<<< HEAD
  
      // Usar el contexto de autenticación para guardar los datos
      login(userData);
  
      // Redireccionar al panel de administración
=======
      login(userData);
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
      navigate("/admin");
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Iniciar Sesión</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Ingresa tus credenciales para continuar</p>
=======
<<<<<<< HEAD
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">
          Ingresa tus credenciales para continuar
        </p>
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050

        <div className="mb-4 relative">
          <label htmlFor="correo" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Correo electrónico</label>
          <input
            type="email"
<<<<<<< HEAD
            id="correo"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
=======
            className="login-input"
=======
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Iniciar Sesión</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Ingresa tus credenciales para continuar</p>

        <div className="mb-4 relative">
          <label htmlFor="correo" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Correo electrónico</label>
          <input
            type="email"
            id="correo"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
            placeholder="ejemplo@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
        <div className="mb-4 relative">
          <label htmlFor="contrasena" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
=======
<<<<<<< HEAD
        <div className="login-input-group">
          <label className="login-label">Contraseña</label>
          <input
            type="password"
            className="login-input"
=======
        <div className="mb-4 relative">
          <label htmlFor="contrasena" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
        {error && <div className="text-red-500 text-center text-sm mb-4">{error}</div>}
=======
<<<<<<< HEAD
        {error && <div className="login-error">{error}</div>}
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050

        <button 
          type="submit" 
          className="w-full bg-green-500 text-white py-3 rounded-md text-sm font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        >
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

<<<<<<< HEAD
        <div className="text-center mt-4 text-sm text-gray-500">
          <a href="#" className="text-green-500 hover:underline">¿Olvidaste tu contraseña?</a>
=======
        <div className="login-forgot">
          <a href="#">¿Olvidaste tu contraseña?</a>
=======
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
>>>>>>> origin/Diogo
>>>>>>> dad9002c0bb161c35b7ec24da904d0f688d84050
        </div>
      </form>
    </div>
  );
}
