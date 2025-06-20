import { createContext } from 'react';

// Crear contexto con un valor inicial que corresponde a la estructura 
// de datos que proporciona useTheme
export const ThemeContext = createContext({
  palette: {},
  setPalette: () => {},
  handleColorChange: () => {},
  savePalette: () => {},
  resetPalette: () => {},
  colorNames: {},
  defaultPalette: {}
});