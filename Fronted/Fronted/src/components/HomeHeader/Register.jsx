import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./Register.css";

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    confirmContrasena: "",
    empresa: "", // Nuevo campo para la empresa
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validar que las contraseñas coincidan
    if (formData.contrasena !== formData.confirmContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar que se haya ingresado el nombre de la empresa
    if (!formData.empresa.trim()) {
      setError("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);

    try {
      // Llamar al servicio de registro con los datos de empresa
      await authService.register(
        formData.nombre,
        formData.correo,
        formData.contrasena,
        formData.empresa // Añadimos el nombre de la empresa
      );

      // Redirigir al login después de un registro exitoso
      navigate("/login");
    } catch (error) {
      console.error("Error de registro:", error);
      setError(
        error.response?.data?.detail || error.message || "Error al registrarse"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-form">
        <h1 className="register-title">Crear Cuenta</h1>
        <p className="register-subtitle">
          Completa tus datos para comenzar
        </p>

        <div className="register-input-group">
          <label className="register-label">Nombre completo</label>
          <input
            type="text"
            name="nombre"
            className="register-input"
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Empresa</label>
          <input
            type="text"
            name="empresa"
            className="register-input"
            placeholder="Nombre de tu empresa"
            value={formData.empresa}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Correo electrónico</label>
          <input
            type="email"
            name="correo"
            className="register-input"
            placeholder="ejemplo@correo.com"
            value={formData.correo}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Contraseña</label>
          <input
            type="password"
            name="contrasena"
            className="register-input"
            placeholder="Contraseña"
            value={formData.contrasena}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Confirmar contraseña</label>
          <input
            type="password"
            name="confirmContrasena"
            className="register-input"
            placeholder="Confirma tu contraseña"
            value={formData.confirmContrasena}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {error && <div className="register-error">{error}</div>}

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <div className="register-login-link">
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
        </div>
      </form>
    </div>
  );
}