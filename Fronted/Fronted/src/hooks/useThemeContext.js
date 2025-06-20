import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

// Hook personalizado para facilitar el acceso al contexto del tema
const useThemeContext = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext debe usarse dentro de un ThemeProvider');
  }
  
  return context;
};

export default useThemeContext;