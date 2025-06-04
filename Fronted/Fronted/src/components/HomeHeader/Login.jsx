import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      
      // Esperar un momento para asegurar que el localStorage se actualice
      setTimeout(() => {
        // Comprobación explícita del tipo de usuario
        const userType = localStorage.getItem('user_type');
        console.log("Redirección después del login - Tipo de usuario:", userType);
        
        // Verificar si hay un ciclo de redirección
        const redirectCount = parseInt(localStorage.getItem('redirect_count') || '0');
        if (redirectCount > 3) {
          // Resetear contador y mostrar mensaje de error
          localStorage.removeItem('redirect_count');
          setError("Se detectó un problema con la navegación. Por favor, intente de nuevo.");
          console.error("Ciclo de redirección detectado y detenido");
          setIsLoading(false);
          return;
        }

        // Establecer contador
        localStorage.setItem('redirect_count', (redirectCount + 1).toString());

        // Continuar con la redirección normal
        if (userType === 'usuario') {
          console.log("Redirigiendo a usuario administrador al dashboard");
          navigate('/admin');
        } else {
          // Lógica para otros tipos de usuario
          const userRole = localStorage.getItem('rol');
          console.log("Redirigiendo a empleado con rol:", userRole);
          
          switch(userRole) {
            case 'Cajero':
              navigate('/admin/ventas');
              break;
            case 'Gestor de Inventario':
              navigate('/admin/inventario');
              break;
            default:
              navigate('/admin');
          }
        }
        
        setIsLoading(false);
      }, 300); // Pequeña pausa para asegurar que todo se guarde bien
      
    } catch (error) {
      console.error("Error en login:", error);
      setError(error.response?.data?.detail || error.message || "Error al iniciar sesión");
      setIsLoading(false);
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

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                const allStorage = {};
                Object.keys(localStorage).forEach(key => {
                  allStorage[key] = localStorage.getItem(key);
                });
                console.log("Diagnóstico de localStorage:", allStorage);
                alert("Diagnóstico enviado a la consola. Presiona F12 para ver detalles.");
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Diagnóstico
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
