import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
<<<<<<< HEAD
import "./Register.css";
=======
>>>>>>> origin/Diogo

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    confirmContrasena: "",
<<<<<<< HEAD
    empresa: "", // Nuevo campo para la empresa
=======
    nombre_empresa: "",
    direccion: "",
    nit_empresa: "",
>>>>>>> origin/Diogo
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

<<<<<<< HEAD
    // Validar que las contraseñas coincidan
=======
>>>>>>> origin/Diogo
    if (formData.contrasena !== formData.confirmContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

<<<<<<< HEAD
    // Validar que se haya ingresado el nombre de la empresa
    if (!formData.empresa.trim()) {
=======
    if (!formData.nombre_empresa.trim()) {
>>>>>>> origin/Diogo
      setError("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);

    try {
<<<<<<< HEAD
      // Llamar al servicio de registro con los datos de empresa
      await authService.register(
        formData.nombre,
        formData.correo,
        formData.contrasena,
        formData.empresa // Añadimos el nombre de la empresa
      );

      // Redirigir al login después de un registro exitoso
=======
      // Pasar como un solo objeto, renombrando contrasena a password
      await authService.register({
        nombre: formData.nombre,
        correo: formData.correo,
        password: formData.contrasena, // Nota: aquí se renombra contrasena a password
        nombre_empresa: formData.nombre_empresa,
        direccion: formData.direccion,
        nit_empresa: formData.nit_empresa,
        // El valor role_id ya tiene un valor predeterminado en el servicio
      });
>>>>>>> origin/Diogo
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
<<<<<<< HEAD
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
=======
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white rounded-lg shadow-xl p-10 w-full max-w-md transition-transform duration-300 transform hover:translate-y-1"
      >
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Crear Cuenta
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Completa tus datos para comenzar
        </p>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Nombre completo
          </label>
          <input
            type="text"
            name="nombre"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
>>>>>>> origin/Diogo
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
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
=======
        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Correo electrónico
          </label>
          <input
            type="email"
            name="correo"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
>>>>>>> origin/Diogo
            placeholder="ejemplo@correo.com"
            value={formData.correo}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
        <div className="register-input-group">
          <label className="register-label">Contraseña</label>
          <input
            type="password"
            name="contrasena"
            className="register-input"
=======
        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Contraseña
          </label>
          <input
            type="password"
            name="contrasena"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
>>>>>>> origin/Diogo
            placeholder="Contraseña"
            value={formData.contrasena}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
        <div className="register-input-group">
          <label className="register-label">Confirmar contraseña</label>
          <input
            type="password"
            name="confirmContrasena"
            className="register-input"
=======
        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Confirmar contraseña
          </label>
          <input
            type="password"
            name="confirmContrasena"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
>>>>>>> origin/Diogo
            placeholder="Confirma tu contraseña"
            value={formData.confirmContrasena}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

<<<<<<< HEAD
        {error && <div className="register-error">{error}</div>}

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <div className="register-login-link">
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
=======
        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Nombre de la empresa
          </label>
          <input
            type="text"
            name="nombre_empresa"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Nombre de tu empresa"
            value={formData.nombre_empresa}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Dirección de la empresa"
            value={formData.direccion}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            NIT
          </label>
          <input
            type="text"
            name="nit_empresa"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Número de Identificación Tributaria"
            value={formData.nit_empresa}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4 bg-red-100 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full p-3 bg-green-500 text-white font-semibold rounded-md transition-colors duration-300 hover:bg-green-600 focus:outline-none"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <div className="text-center mt-4 text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="text-green-500 font-semibold hover:underline">
            Inicia sesión
          </a>
>>>>>>> origin/Diogo
        </div>
      </form>
    </div>
  );
}