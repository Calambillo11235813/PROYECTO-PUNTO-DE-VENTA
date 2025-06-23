import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStore, FaPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import sucursalService from '../services/SucursalService';
import { useAuth } from '../components/Contexts/AuthContext'; // Ajusta la ruta según tu estructura

const SucursalesManager = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Obtener el usuario autenticado
  
  // Cargar sucursales al montar el componente
  useEffect(() => {
    loadSucursales();
  }, [user]); // Añadir user como dependencia
  
  // Modificar la función loadSucursales para usar getSucursalesByUsuario
  const loadSucursales = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay usuario autenticado
      if (!user || !user.id) {
        console.error('No hay un usuario autenticado o falta el ID');
        toast.error('No se pudo obtener información del usuario');
        setSucursales([]);
        setLoading(false);
        return;
      }
      
      console.log(`Cargando sucursales del usuario ${user.id}...`);
      
      // Usar el método getSucursalesByUsuario en lugar de getMisSucursales
      const data = await sucursalService.getSucursalesByUsuario(user.id);
      setSucursales(data);
      
      // Verificar si hay una sucursal seleccionada en localStorage
      const sucursalActualId = localStorage.getItem('sucursal_actual_id');
      console.log('Sucursal actual:', sucursalActualId);
      
      // Si no hay sucursal seleccionada y hay sucursales disponibles, seleccionar la primera
      if (!sucursalActualId && data.length > 0) {
        localStorage.setItem('sucursal_actual_id', data[0].id);
        localStorage.setItem('sucursal_actual_nombre', data[0].nombre);
        console.log('✅ Auto-seleccionando primera sucursal:', data[0].id);
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      toast.error('No se pudieron cargar las sucursales');
      setSucursales([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para establecer una sucursal como la actual
  const setCurrentSucursal = (sucursal) => {
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    toast.success(`Sucursal "${sucursal.nombre}" seleccionada como actual`);
    // Forzar recarga de la lista para actualizar la UI
    loadSucursales();
  };
  
  const handleDelete = async (id) => {
    // Verificar si es la sucursal actual
    const sucursalActualId = localStorage.getItem('sucursal_actual_id');
    if (sucursalActualId && parseInt(sucursalActualId) === id) {
      toast.error('No puedes eliminar la sucursal actual. Selecciona otra primero.');
      return;
    }
    
    if (!window.confirm('¿Está seguro de eliminar esta sucursal?')) return;
    
    try {
      await sucursalService.deleteSucursal(id);
      toast.success('Sucursal eliminada con éxito');
      loadSucursales(); // Recargar la lista
    } catch (error) {
      toast.error(error.message || 'Error al eliminar la sucursal');
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administrar Sucursales</h1>
        <button className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2 hover:bg-green-600">
          <FaPlus /> Nueva Sucursal
        </button>
      </div>
      
      {/* Lista de sucursales */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No tienes sucursales registradas.
            </div>
          ) : (
            sucursales.map(sucursal => {
              // Verificar si esta es la sucursal actual
              const isCurrent = localStorage.getItem('sucursal_actual_id') === sucursal.id.toString();
              
              return (
                <div key={sucursal.id} className={`bg-white shadow-md rounded-lg overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold mb-2">{sucursal.nombre}</h3>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          <FaStar className="mr-1" /> Actual
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{sucursal.direccion}</p>
                    <p className="text-gray-500 text-sm">{sucursal.telefono || 'Sin teléfono'}</p>
                    <p className="text-gray-500 text-sm">{sucursal.email || 'Sin email'}</p>
                    
                    <div className="flex mt-4 space-x-2">
                      {!isCurrent && (
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                          onClick={() => setCurrentSucursal(sucursal)}
                        >
                          <FaStar className="inline mr-1" /> Usar
                        </button>
                      )}
                      
                      <button
                        className="px-3 py-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                        onClick={() => {/* Lógica para editar */}}
                      >
                        <FaEdit className="inline mr-1" /> Editar
                      </button>
                      
                      <button
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                        onClick={() => handleDelete(sucursal.id)}
                        disabled={isCurrent}
                      >
                        <FaTrash className="inline mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SucursalesManager;