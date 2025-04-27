import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import authService from "../../services/authService";
import "./Login.css";

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
        console.error("Fallo en prueba de conexión");
      }
    };

    testConn();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Llamar al servicio de autenticación
      const response = await authService.login(correo, contrasena);

      // Extraer datos del usuario de la respuesta
      const userData = {
        id: response.usuario.id,
        nombre: response.usuario.nombre, // Cambio "name" a "nombre" para mantener consistencia
        correo: response.usuario.correo, // Cambio "email" a "correo" para mantener consistencia
        rol: response.usuario.rol || { nombre: "admin" }, // Mantener la estructura anidada completa
      };

      console.log("Usuario autenticado:", userData);

      // Usar el contexto de autenticación para guardar los datos
      login(userData);

      // Redireccionar al panel de administración
      navigate("/admin");
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">
          Ingresa tus credenciales para continuar
        </p>

        <div className="login-input-group">
          <label className="login-label">Correo electrónico</label>
          <input
            type="email"
            className="login-input"
            placeholder="ejemplo@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="login-input-group">
          <label className="login-label">Contraseña</label>
          <input
            type="password"
            className="login-input"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

        <div className="login-forgot">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  );
}
