import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import rolService from '../services/rolService';
import permisoService from '../services/permisoService';
import { toast } from 'react-toastify';

const RolesYPermisos = () => {
  // Estados principales
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [permisosDelRol, setPermisosDelRol] = useState([]);
  
  // Estados de modales
  const [showRolModal, setShowRolModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  
  // Estados de formularios
  const [nuevoRol, setNuevoRol] = useState({ nombre_rol: '' });
  
  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('id');
        
        // Cargar roles del usuario actual
        const rolesData = await rolService.getRolesByUsuario(userId);
        setRoles(rolesData.roles || []);
        
        // Cargar todos los permisos disponibles
        const permisosData = await permisoService.getAllPermisos();
        setPermisos(permisosData || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos: ' + (error.message || 'Error desconocido'));
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Seleccionar un rol y cargar sus permisos
  const handleSelectRol = async (rol) => {
    setSelectedRol(rol);
    
    try {
      // Obtener los permisos del rol seleccionado
      const rolDetallado = await rolService.getRolById(rol.id);
      setPermisosDelRol(rolDetallado.permisos || []);
    } catch (error) {
      console.error('Error al cargar detalles del rol:', error);
      toast.error('Error al cargar detalles del rol');
    }
  };

  // Crear un nuevo rol
  const handleCrearRol = async (e) => {
    e.preventDefault();
    if (!nuevoRol.nombre_rol.trim()) {
      toast.warning('El nombre del rol es obligatorio');
      return;
    }

    try {
      const resultado = await rolService.createRol(nuevoRol);
      setRoles([...roles, resultado.rol_creado]);
      setNuevoRol({ nombre_rol: '' });
      setShowRolModal(false);
      toast.success('Rol creado correctamente');
    } catch (error) {
      console.error('Error al crear rol:', error);
      toast.error('Error al crear rol: ' + (error.message || 'Error desconocido'));
    }
  };

  // Eliminar un rol
  const handleEliminarRol = async (rolId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este rol?')) return;
    
    try {
      await rolService.deleteRol(rolId);
      setRoles(roles.filter(r => r.id !== rolId));
      if (selectedRol && selectedRol.id === rolId) {
        setSelectedRol(null);
        setPermisosDelRol([]);
      }
      toast.success('Rol eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      toast.error('Error al eliminar rol: ' + (error.message || 'Error desconocido'));
    }
  };

  // Actualizar los permisos de un rol
  const handleActualizarPermisos = async () => {
    if (!selectedRol) return;

    try {
      // Crear una copia del rol seleccionado con los permisos actualizados
      const rolActualizado = {
        ...selectedRol,
        permisos: permisosDelRol
      };

      await rolService.updateRol(selectedRol.id, rolActualizado);
      
      // Actualizar el rol en la lista de roles
      const nuevosRoles = roles.map(r => 
        r.id === selectedRol.id ? {...r, permisos: permisosDelRol} : r
      );
      setRoles(nuevosRoles);
      
      setShowPermisosModal(false);
      toast.success('Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      toast.error('Error al actualizar permisos: ' + (error.message || 'Error desconocido'));
    }
  };

  // Verificar si un permiso está asignado al rol
  const permisoEstaAsignado = (permisoId) => {
    return permisosDelRol.includes(permisoId);
  };

  // Alternar la asignación de un permiso
  const togglePermiso = (permisoId) => {
    if (permisoEstaAsignado(permisoId)) {
      // Quitar el permiso
      setPermisosDelRol(permisosDelRol.filter(id => id !== permisoId));
    } else {
      // Añadir el permiso
      setPermisosDelRol([...permisosDelRol, permisoId]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Roles y Permisos</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Mis Roles</h2>
          <button 
            onClick={() => setShowRolModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center"
          >
            <FaPlus className="mr-1" /> Nuevo Rol
          </button>
        </div>
        
        {roles.length === 0 ? (
          <p className="text-gray-500 italic">No tienes roles creados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nombre del Rol</th>
                  <th className="py-3 px-6 text-left">Permisos</th>
                  <th className="py-3 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {roles.map(rol => (
                  <tr key={rol.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      <span className="font-medium">{rol.nombre_rol}</span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {rol.permisos && rol.permisos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rol.permisos.map(permisoId => {
                            const permiso = permisos.find(p => p.id === permisoId);
                            return permiso ? (
                              <span key={permisoId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {permiso.nombre}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin permisos</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex justify-center items-center space-x-3">
                        <button 
                          onClick={() => {
                            handleSelectRol(rol);
                            setShowPermisosModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Gestionar permisos"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleEliminarRol(rol.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar rol"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear rol */}
      {showRolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Nuevo Rol</h2>
            <form onSubmit={handleCrearRol}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre del Rol:</label>
                <input
                  type="text"
                  value={nuevoRol.nombre_rol}
                  onChange={(e) => setNuevoRol({...nuevoRol, nombre_rol: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Administrador, Vendedor, etc."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRolModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gestionar permisos del rol */}
      {showPermisosModal && selectedRol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Gestionar permisos para: <span className="text-blue-600">{selectedRol.nombre_rol}</span>
            </h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Permisos disponibles:</h3>
              
              {permisos.length === 0 ? (
                <p className="text-gray-500 italic">No hay permisos disponibles</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {permisos.map(permiso => (
                    <div 
                      key={permiso.id}
                      className={`p-3 rounded-md border ${
                        permisoEstaAsignado(permiso.id) 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{permiso.nombre}</h4>
                          <p className="text-sm text-gray-600">{permiso.descripcion}</p>
                        </div>
                        <button 
                          onClick={() => togglePermiso(permiso.id)}
                          className={`${
                            permisoEstaAsignado(permiso.id) 
                              ? 'text-red-500 hover:text-red-700' 
                              : 'text-green-500 hover:text-green-700'
                          }`}
                          title={permisoEstaAsignado(permiso.id) ? 'Quitar permiso' : 'Asignar permiso'}
                        >
                          {permisoEstaAsignado(permiso.id) ? <FaTimes /> : <FaCheck />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPermisosModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarPermisos}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesYPermisos;