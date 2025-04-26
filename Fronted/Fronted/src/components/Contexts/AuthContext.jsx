import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

// Verificar si hay una sesión guardada al cargar la página
useEffect(() => {
const storedUser = localStorage.getItem('user');
if (storedUser) {
setUser(JSON.parse(storedUser));
}
setLoading(false);
}, []);

// Función para iniciar sesión
const login = (userData) => {
setUser(userData);
localStorage.setItem('user', JSON.stringify(userData));
return true;
};

// Función para cerrar sesión
const logout = () => {
setUser(null);
localStorage.removeItem('user');
};

// Verificar si el usuario está autenticado
const isAuthenticated = () => !!user;

// Verificar si el usuario tiene rol admin
const isAdmin = () => user?.role === 'admin';

const value = {
user,
login,
logout,
isAuthenticated,
isAdmin,
loading
};

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
return useContext(AuthContext);
};