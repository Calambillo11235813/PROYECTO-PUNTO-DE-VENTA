import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../Contexts/AuthContext'; // Importar el contexto de autenticación

const Login = () => {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Obtener la función login del contexto

  const { correo, contrasena } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(correo, contrasena);
      
      // Asegurar que el rol se guarde correctamente para usuarios principales
      if (response.tipo === 'usuario') {
        localStorage.setItem('rol', 'admin');
      }
      
      // Actualizar el contexto (esto debería desencadenar una re-renderización)
      login({...response.usuario, rol: 'admin'});
      
      // Obtener el rol del usuario desde localStorage después del login
      const userRole = localStorage.getItem('rol');
      const userType = localStorage.getItem('user_type');
      
      console.log('Login exitoso, rol:', userRole, 'tipo:', userType);
      
      // Verificar si hay sucursales antes de redirigir
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      
      // Determinar la ruta de redirección
      let redirectPath;
      
      if (userType === 'empleado') {
        // Lógica para empleados sin cambios
        switch(userRole) {
          case 'Cajero':
            redirectPath = '/admin/ventas';
            break;
          case 'Gestion de inventario':
            redirectPath = '/admin/inventario';
            break;
          case 'Supervisor':
            redirectPath = '/admin';
            break;
          default:
            redirectPath = '/admin';
        }
      } else {
        // Para administradores
        redirectPath = sucursalId ? '/admin' : '/primera-sucursal';
      }
      
      // Usar setTimeout para asegurar que la redirección ocurra después de que React actualice el estado
      setTimeout(() => {
        console.log('Redirigiendo a:', redirectPath);
        navigate(redirectPath, { replace: true });
      }, 100);
      
    } catch (error) {
      setIsLoading(false);
      setError(error.message);
      console.error('Error de login:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Iniciar Sesión</h1>
        
        <div className="mb-4 relative">
          <label htmlFor="correo" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Correo electrónico</label>
          <input
            type="email"
            id="correo"
            name="correo"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ejemplo@correo.com"
            value={correo}
            onChange={onChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="mb-4 relative">
          <label htmlFor="contrasena" className="absolute top-[-0.7rem] left-2 text-xs bg-white px-1 text-gray-500">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            name="contrasena"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contraseña"
            value={contrasena}
            onChange={onChange}
            disabled={isLoading}
            required
          />
        </div>

        {error && <div className="text-red-500 text-center text-sm mb-4">{error}</div>}

        <button 
          type="submit" 
          className="w-full bg-green-500 text-white py-3 rounded-md text-sm font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

        <div className="text-center mt-4 text-sm text-gray-500">
          <Link to="/forgot-password" className="text-green-500 hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
