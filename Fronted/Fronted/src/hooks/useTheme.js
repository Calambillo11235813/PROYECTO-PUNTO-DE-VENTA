import { useState, useEffect } from 'react';

// Paleta de colores predeterminada
const defaultPalette = {
  "--bg-primary": "#f8f9fa",
  "--bg-secondary": "#e9ecef",
  "--bg-tertiary": "#ffffff",
  "--text-primary": "#2d3748",
  "--text-secondary": "#2d3748",
  "--accent-color": "#45a049",
  "--header-bg": "#ffffff",
};

// Nombres descriptivos para las variables de color
const colorNames = {
  "--bg-primary": "Color de fondo",
  "--bg-secondary": "Color de sidebar",
  "--bg-tertiary": "Color de objetos",
  "--bg-report-section": "Color de secciones en reportes", // Nuevo nombre descriptivo
  "--text-primary": "Color de letra títulos",
  "--text-secondary": "Color de letra en general",
  "--accent-color": "Color de iconos",
  "--header-bg": "Color del navbar",
};

/**
 * Hook personalizado para gestionar la tematización de la aplicación
 * @returns {Object} Funciones y estado para manejar temas
 */
const useTheme = () => {
  const [palette, setPalette] = useState(defaultPalette);
  
  // Cargar tema al iniciar
  useEffect(() => {
    const stored = localStorage.getItem("custom-palette");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPalette(parsed);
        applyPalette(parsed);
      } catch (error) {
        console.error("Error al cargar la paleta de colores:", error);
        // Si hay error, aplicar la paleta predeterminada
        applyPalette(defaultPalette);
      }
    }
  }, []);
  
  /**
   * Aplica la paleta de colores al documento
   * @param {Object} palette - Objeto con variables CSS y sus valores
   */
  const applyPalette = (palette) => {
    Object.entries(palette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    
    // Agregar esta línea para que --bg-report-section use --bg-secondary automáticamente
    document.documentElement.style.setProperty('--bg-report-section', 
      document.documentElement.style.getPropertyValue('--bg-secondary'));
  };
  
  /**
   * Maneja cambios en los valores de color
   * @param {Event} e - Evento del input color
   * @param {string} variable - Variable CSS a modificar
   */
  const handleColorChange = (e, variable) => {
    const newPalette = { ...palette, [variable]: e.target.value };
    setPalette(newPalette);
    // Opcionalmente, aplicar en tiempo real
    document.documentElement.style.setProperty(variable, e.target.value);
  };
  
  /**
   * Guarda la paleta actual en localStorage
   */
  const savePalette = () => {
    try {
      localStorage.setItem("custom-palette", JSON.stringify(palette));
      applyPalette(palette);
    } catch (error) {
      console.error("Error al guardar la paleta de colores:", error);
    }
  };
  
  /**
   * Resetea la paleta a los valores predeterminados
   */
  const resetPalette = () => {
    setPalette(defaultPalette);
    applyPalette(defaultPalette);
    localStorage.removeItem("custom-palette");
  };
  
  return {
    palette,
    setPalette,
    handleColorChange,
    savePalette,
    resetPalette,
    colorNames,
    defaultPalette
  };
};

export default useTheme;