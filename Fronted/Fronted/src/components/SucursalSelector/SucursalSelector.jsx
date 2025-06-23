import React, { useState, useEffect } from 'react';
import { FaStore, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import sucursalService from '../../services/SucursalService';

const SucursalSelector = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentSucursal, setCurrentSucursal] = useState(null);
  
  useEffect(() => {
    loadSucursales();
    
    // Manejo del cierre del dropdown al hacer clic fuera
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.sucursal-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  useEffect(() => {
    // Monitorear cambios en localStorage para actualizar la sucursal actual
    const handleStorageChange = () => {
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const sucursalNombre = localStorage.getItem('sucursal_actual_nombre');
      
      if (sucursalId && sucursalNombre) {
        setCurrentSucursal({
          id: sucursalId,
          nombre: sucursalNombre
        });
      }
    };
    
    // Ejecutar una vez al montar
    handleStorageChange();
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const loadSucursales = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('id');
      
      if (!userId) {
        console.warn('No se encontró ID de usuario en localStorage');
        setLoading(false);
        return;
      }
      
      const data = await sucursalService.getSucursalesByUsuario(userId);
      setSucursales(data);
      
      // Actualizar la sucursal actual desde localStorage
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const sucursalNombre = localStorage.getItem('sucursal_actual_nombre');
      
      if (sucursalId && sucursalNombre) {
        setCurrentSucursal({
          id: sucursalId,
          nombre: sucursalNombre
        });
      } else if (data.length > 0) {
        // Si no hay sucursal seleccionada pero hay sucursales disponibles
        localStorage.setItem('sucursal_actual_id', data[0].id);
        localStorage.setItem('sucursal_actual_nombre', data[0].nombre);
        setCurrentSucursal({
          id: data[0].id,
          nombre: data[0].nombre
        });
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectSucursal = (sucursal) => {
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    setCurrentSucursal(sucursal);
    setIsOpen(false);
    
    // Crear un evento personalizado para notificar el cambio
    const event = new Event('sucursalChanged');
    window.dispatchEvent(event);
    
    toast.success(`Cambiado a sucursal: ${sucursal.nombre}`);
  };
  
  // Si está cargando o no hay sucursales, mostrar placeholder
  if (loading || sucursales.length === 0) {
    return (
      <div className="sucursal-selector flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100">
        <FaStore className="mr-2 text-gray-500" />
        <span className="text-gray-500">
          {loading ? 'Cargando...' : 'Sin sucursales'}
        </span>
      </div>
    );
  }
  
  // Si solo hay una sucursal, mostrarla sin dropdown
  if (sucursales.length === 1) {
    return (
      <div className="sucursal-selector flex items-center px-3 py-1.5 text-sm rounded-md bg-blue-50 border border-blue-100">
        <FaStore className="mr-2 text-blue-500" />
        <span className="text-blue-700 font-medium">{sucursales[0].nombre}</span>
      </div>
    );
  }
  
  return (
    <div className="sucursal-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-blue-50 border border-gray-200"
      >
        <FaStore className="text-blue-500" />
        <span className="font-medium">
          {currentSucursal ? currentSucursal.nombre : 'Seleccionar sucursal'}
        </span>
        <FaChevronDown className="text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 text-sm text-gray-700 font-semibold border-b">
              Cambiar sucursal
            </div>
            
            {sucursales.map((sucursal) => {
              const isActive = currentSucursal && currentSucursal.id == sucursal.id;
              
              return (
                <button
                  key={sucursal.id}
                  onClick={() => handleSelectSucursal(sucursal)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <span className="flex-grow">{sucursal.nombre}</span>
                    {isActive && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {sucursal.direccion}
                  </div>
                </button>
              );
            })}
            
            <div className="border-t px-4 py-2">
              <a 
                href="/admin/sucursales"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Administrar sucursales
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SucursalSelector;