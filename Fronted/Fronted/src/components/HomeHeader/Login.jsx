import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Credenciales para pruebas
    const validEmail = 'admin@example.com';
    const validPassword = '123456';

    if (email === validEmail && password === validPassword) {
      // Usuario válido
      const userData = {
        id: 1,
        name: 'Administrador',
        email: email,
        role: 'admin'
      };
      
      // Usar el contexto de autenticación para guardar los datos
      login(userData);
      
      // Redireccionar al panel de administración
      navigate('/admin');
    } else {
      setError('Correo electrónico o contraseña incorrectos');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        
        <div className="login-input-group">
          <label className="login-label">Correo electrónico</label>
          <input
            type="email"
            className="login-input"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-input-group">
          <label className="login-label">Contraseña</label>
          <input
            type="password"
            className="login-input"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-button">
          Iniciar Sesión
        </button>
        
        <div className="login-forgot">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  );
}