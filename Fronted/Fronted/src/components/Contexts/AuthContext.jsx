import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../../services/authService';

// Crear el contexto con un objeto vacío como valor predeterminado
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: true
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    const initAuth = () => {
      try {
        // Verificar si hay un token y recuperar datos del usuario
        if (authService.isAuthenticated()) {
          const userData = authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al inicializar la autenticación:", error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Función para iniciar sesión
  const login = (userData) => {
    setUser(userData);
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    return user?.rol?.nombre === 'admin';
  };

  const isEmployee = () => {
    return localStorage.getItem('user_type') === 'empleado';
  };

  const getUserRole = () => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    if (localStorage.getItem('user_type') === 'empleado') {
      return userData.rol; // Para empleados, devolvemos el nombre del rol
    } else {
      return userData.rol?.id || 1; // Para usuarios, devolvemos el id del rol
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEmployee, getUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// Modificar el hook para manejar el caso null
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context; // Siempre devolverá al menos el objeto con valores vacíos
};