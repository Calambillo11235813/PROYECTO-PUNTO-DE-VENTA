// src/context/ThemeProvider.jsx
import React from 'react';
import { ThemeContext } from './ThemeContext';
import useTheme from '../hooks/useTheme';

const ThemeProvider = ({ children }) => {
  const themeData = useTheme();
  
  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;