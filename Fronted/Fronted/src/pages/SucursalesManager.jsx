import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStore, FaPlus, FaEdit, FaTrash, FaStar, FaExchangeAlt } from 'react-icons/fa';
import sucursalService from '../services/SucursalService';
import { useAuth } from '../components/Contexts/AuthContext';
import SucursalForm from '../components/Sucursales/SucursalForm';

const SucursalesManager = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentSucursal, setCurrentSucursal] = useState(null);
  const { user } = useAuth();

  // Cargar sucursales al montar el componente
  useEffect(() => {
    loadSucursales();
  }, [user]);

  const loadSucursales = async () => {
    try {
      setLoading(true);
      
      if (!user || !user.id) {
        console.error('No hay un usuario autenticado o falta el ID');
        toast.error('No se pudo obtener información del usuario');
        setSucursales([]);
        setLoading(false);
        return;
      }
      
      console.log(`Cargando sucursales del usuario ${user.id}...`);
      
      const data = await sucursalService.getSucursalesByUsuario(user.id);
      setSucursales(data);
      
      const sucursalActualId = localStorage.getItem('sucursal_actual_id');
      console.log('Sucursal actual:', sucursalActualId);
      
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
  const setCurrentSucursalHandler = (sucursal) => {
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    toast.success(`Sucursal "${sucursal.nombre}" seleccionada como actual`);
    // Forzar recarga de la lista para actualizar la UI
    loadSucursales();
  };

  const handleOpenForm = (sucursal = null) => {
    setCurrentSucursal(sucursal);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentSucursal(null);
  };

  const handleSaveSucursal = async (formData) => {
    try {
      if (currentSucursal) {
        // Actualizar sucursal existente
        await sucursalService.updateSucursal(currentSucursal.id, formData);
        toast.success('Sucursal actualizada con éxito');
      } else {
        // Crear nueva sucursal
        // Añadir el ID del usuario actual
        const newSucursalData = {
          ...formData,
          usuario: user.id
        };
        
        const newSucursal = await sucursalService.createSucursal(newSucursalData);
        toast.success('Sucursal creada con éxito');
        
        // Si es la primera sucursal, establecerla como actual
        if (sucursales.length === 0) {
          localStorage.setItem('sucursal_actual_id', newSucursal.id);
          localStorage.setItem('sucursal_actual_nombre', newSucursal.nombre);
        }
      }
      
      // Cerrar el formulario y recargar sucursales
      handleCloseForm();
      loadSucursales();
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      toast.error(error.message || 'Error al guardar la sucursal');
    }
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
        <button 
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2 hover:bg-green-600"
        >
          <FaPlus /> Nueva Sucursal
        </button>
      </div>
      
      {/* Indicador de sucursal actual */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <FaStore className="text-blue-500 mr-2" size={20} />
          <div>
            <h3 className="font-medium">Sucursal Actual:</h3>
            <p className="text-blue-700 font-semibold">
              {localStorage.getItem('sucursal_actual_nombre') || 'No seleccionada'}
            </p>
          </div>
        </div>
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
              <div className="mt-2">
                <button 
                  onClick={() => handleOpenForm()}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Crea tu primera sucursal
                </button>
              </div>
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
                    
                    <p className="text-gray-600 mb-2">
                      <strong>Dirección:</strong> {sucursal.direccion}
                    </p>
                    
                    {sucursal.telefono && (
                      <p className="text-gray-500 text-sm">
                        <strong>Teléfono:</strong> {sucursal.telefono}
                      </p>
                    )}
                    
                    {sucursal.email && (
                      <p className="text-gray-500 text-sm">
                        <strong>Email:</strong> {sucursal.email}
                      </p>
                    )}
                    
                    {sucursal.horario && (
                      <p className="text-gray-500 text-sm">
                        <strong>Horario:</strong> {sucursal.horario}
                      </p>
                    )}
                    
                    <p className="text-sm mt-2">
                      <span className={`inline-block px-2 py-1 rounded ${
                        sucursal.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sucursal.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </p>
                    
                    <div className="flex mt-4 space-x-2">
                      {!isCurrent && (
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 flex items-center"
                          onClick={() => setCurrentSucursalHandler(sucursal)}
                        >
                          <FaExchangeAlt className="mr-1" /> Seleccionar
                        </button>
                      )}
                      
                      <button
                        className="px-3 py-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200 flex items-center"
                        onClick={() => handleOpenForm(sucursal)}
                      >
                        <FaEdit className="mr-1" /> Editar
                      </button>
                      
                      <button
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center"
                        onClick={() => handleDelete(sucursal.id)}
                        disabled={isCurrent}
                      >
                        <FaTrash className="mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {/* Formulario modal */}
      {showForm && (
        <SucursalForm 
          sucursal={currentSucursal}
          onSave={handleSaveSucursal}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default SucursalesManager;