import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaKey, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import rolService from '../../services/rolService';
import permisoService from '../../services/permisoService';

const RolesPage = () => {
  // Estados para gestionar datos y UI
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [formData, setFormData] = useState({ nombre_rol: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [allPermisosForRole, setAllPermisosForRole] = useState([]);
  const [permisosSearchTerm, setPermisosSearchTerm] = useState('');

  // Obtener el ID del usuario logueado
  const usuarioId = localStorage.getItem('id');

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Cargar roles del usuario
        const rolesData = await rolService.getAllRoles();
        setRoles(rolesData);
        
        // Cargar todos los permisos disponibles
        const permisosData = await permisoService.getAllPermisos();
        setPermisos(permisosData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos. Por favor intente de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar roles según término de búsqueda
  const filteredRoles = roles.filter(role => 
    role.nombre_rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar permisos según término de búsqueda
  const filteredPermisos = permisos.filter(permiso => 
    permiso.nombre.toLowerCase().includes(permisosSearchTerm.toLowerCase()) ||
    permiso.descripcion?.toLowerCase().includes(permisosSearchTerm.toLowerCase())
  );

  // Manejadores de eventos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      // Modo edición
      setCurrentRole(role);
      setFormData({ nombre_rol: role.nombre_rol });
    } else {
      // Modo creación
      setCurrentRole(null);
      setFormData({ nombre_rol: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentRole(null);
    setFormData({ nombre_rol: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar datos
    if (!formData.nombre_rol.trim()) {
      toast.error("El nombre del rol es obligatorio");
      return;
    }
    
    try {
      // Si tenemos un rol actual, actualizamos, sino creamos nuevo
      if (currentRole) {
        await rolService.updateRol(currentRole.id, formData);
        setRoles(roles.map(role => 
          role.id === currentRole.id ? { ...role, ...formData } : role
        ));
        toast.success("Rol actualizado exitosamente");
      } else {
        const newRole = await rolService.createRol({
          ...formData,
          usuario: usuarioId
        });
        setRoles([...roles, newRole.rol_creado]);
        toast.success("Rol creado exitosamente");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error al procesar el rol");
    }
  };

  const handleDeleteClick = (roleId) => {
    setConfirmDelete(roleId);
  };

  const handleConfirmDelete = async () => {
    try {
      await rolService.deleteRol(confirmDelete);
      setRoles(roles.filter(role => role.id !== confirmDelete));
      toast.success("Rol eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("No se pudo eliminar el rol");
    } finally {
      setConfirmDelete(null);
    }
  };

  // Gestión de permisos
  const handleOpenPermisosModal = async (role) => {
    setCurrentRole(role);
    setLoading(true);
    
    try {
      // Obtener permisos del rol
      const rolPermisos = await rolService.getRolPermisos(role.id);
      const permisosIds = rolPermisos.permisos.map(p => p.id);
      
      setSelectedPermisos(permisosIds);
      setAllPermisosForRole(rolPermisos.permisos);
      setShowPermisosModal(true);
    } catch (error) {
      console.error("Error al cargar permisos del rol:", error);
      toast.error("No se pudieron cargar los permisos del rol");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermiso = (permisoId) => {
    setSelectedPermisos(prev => 
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  const handleSavePermisos = async () => {
    try {
      setLoading(true);
      
      // Obtener permisos actuales
      const currentPermisos = allPermisosForRole.map(p => p.id);
      
      // Determinar permisos a añadir y eliminar
      const permisosToAdd = selectedPermisos.filter(id => !currentPermisos.includes(id));
      const permisosToRemove = currentPermisos.filter(id => !selectedPermisos.includes(id));
      
      // Aplicar cambios
      if (permisosToAdd.length > 0) {
        await rolService.addPermisosToRol(currentRole.id, permisosToAdd);
      }
      
      if (permisosToRemove.length > 0) {
        await rolService.removePermisosFromRol(currentRole.id, permisosToRemove);
      }
      
      toast.success("Permisos actualizados exitosamente");
      
      // Actualizar la lista de roles para reflejar los cambios
      const updatedRoles = await rolService.getAllRoles();
      setRoles(updatedRoles);
      
      setShowPermisosModal(false);
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      toast.error("Error al guardar los permisos");
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional para estado de carga
  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Roles</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          <FaPlus className="mr-2" /> Nuevo Rol
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar roles..."
          className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de roles */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permisos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoles.length > 0 ? (
              filteredRoles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.nombre_rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {role.permisos?.length || 0} permisos
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenPermisosModal(role)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Gestionar permisos"
                      >
                        <FaKey />
                      </button>
                      <button
                        onClick={() => handleOpenModal(role)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron roles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar rol */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {currentRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre_rol">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  id="nombre_rol"
                  name="nombre_rol"
                  value={formData.nombre_rol}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Nombre del rol"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {currentRole ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="mb-4">¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar permisos */}
      {showPermisosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              Permisos para rol: {currentRole?.nombre_rol}
            </h2>
            
            {/* Barra de búsqueda para permisos */}
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar permisos..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={permisosSearchTerm}
                onChange={(e) => setPermisosSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Lista de permisos */}
            <div className="overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPermisos.map(permiso => (
                  <div 
                    key={permiso.id} 
                    className={`border p-3 rounded-md ${
                      selectedPermisos.includes(permiso.id) 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{permiso.nombre}</h3>
                        <p className="text-sm text-gray-500">{permiso.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div>
                        <button 
                          onClick={() => handleTogglePermiso(permiso.id)}
                          className={`p-2 rounded-full ${
                            selectedPermisos.includes(permiso.id)
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {selectedPermisos.includes(permiso.id) 
                            ? <FaCheck /> 
                            : <FaTimes />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPermisos.length === 0 && (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    No se encontraron permisos
                  </div>
                )}
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <button
                onClick={() => setShowPermisosModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermisos}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Permisos'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;