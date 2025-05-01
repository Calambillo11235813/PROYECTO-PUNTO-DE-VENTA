import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    confirmContrasena: "",
    empresa: "",
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

    if (formData.contrasena !== formData.confirmContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!formData.empresa.trim()) {
      setError("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);

    try {
      await authService.register(
        formData.nombre,
        formData.correo,
        formData.contrasena,
        formData.empresa
      );
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
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Empresa
          </label>
          <input
            type="text"
            name="empresa"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Nombre de tu empresa"
            value={formData.empresa}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Correo electrónico
          </label>
          <input
            type="email"
            name="correo"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="ejemplo@correo.com"
            value={formData.correo}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Contraseña
          </label>
          <input
            type="password"
            name="contrasena"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Contraseña"
            value={formData.contrasena}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="absolute top-[-8px] left-2 text-xs text-gray-500 bg-white px-1">
            Confirmar contraseña
          </label>
          <input
            type="password"
            name="confirmContrasena"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Confirma tu contraseña"
            value={formData.confirmContrasena}
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
        </div>
      </form>
    </div>
  );
}
