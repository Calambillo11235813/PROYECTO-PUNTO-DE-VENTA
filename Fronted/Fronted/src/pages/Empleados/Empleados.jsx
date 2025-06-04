import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaBan, FaUserCheck, FaSearch, FaUserCircle } from 'react-icons/fa';
import { empleadoService } from '../../services/EmpleadoService';
import rolService from '../../services/rolService';
import permisoService from '../../services/permisoService';

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [rolMapping, setRolMapping] = useState({});
  const [userPermisos, setUserPermisos] = useState([]);
  const [permisosLoading, setPermisosLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar los permisos del usuario
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        setPermisosLoading(true);
        
        // Verificar si es administrador
        const userType = localStorage.getItem('user_type');
        if (userType === 'usuario') {
          // Administrador tiene todos los permisos
          setUserPermisos(['ver_empleados', 'agregar_empleados', 'editar_empleado', 'eliminar_empleado']);
          setPermisosLoading(false);
          return;
        }
        
        // Para otros usuarios, cargar sus permisos específicos
        const empleadoId = localStorage.getItem('id');
        if (!empleadoId) {
          console.warn("No se encontró ID de empleado en localStorage");
          setPermisosLoading(false);
          return;
        }
        
        const permisosData = await permisoService.getPermisosEmpleado(empleadoId);
        
        // Convertir el resultado a un array de nombres de permisos
        if (Array.isArray(permisosData)) {
          setUserPermisos(permisosData.map(p => p.nombre));
        } else {
          console.warn("Formato de permisos inesperado:", permisosData);
          setUserPermisos([]);
        }
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        setUserPermisos([]);
      } finally {
        setPermisosLoading(false);
      }
    };
    
    cargarPermisos();
  }, []);

  // Verificar si el usuario tiene un permiso específico
  const tienePermiso = useCallback((permisoRequerido) => {
    // Si el usuario es de tipo "usuario" (administrador general), tiene acceso a todo
    const userType = localStorage.getItem('user_type');
    if (userType === 'usuario') return true;
    
    // Para otros tipos de usuarios, verificar permisos específicos
    if (!permisoRequerido) return true; // Si no se requiere permiso específico
    
    // Si es usuario admin (puedes identificarlo por un permiso especial)
    if (userPermisos.includes('admin_acceso_total')) return true;
    
    // Verificar si el usuario tiene el permiso específico
    return userPermisos.includes(permisoRequerido);
  }, [userPermisos]);

  // Cargar roles y empleados al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Solo cargar datos si el usuario tiene permiso
        if (!tienePermiso('ver_empleados')) {
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // Obtener el ID del usuario actual
        const userId = localStorage.getItem('id');
        if (!userId) {
          throw new Error('No se encontró ID de usuario en localStorage');
        }
        
        // Cargar roles del usuario actual
        const rolesData = await rolService.getRolesByUsuario(userId);
        
        // Crear el mapeo de roles dinámicamente
        const mapping = {};
        if (rolesData && rolesData.roles) {
          rolesData.roles.forEach(rol => {
            mapping[rol.id] = rol.nombre_rol;
          });
        }
        setRolMapping(mapping);
        
        // Cargar empleados
        const empleadosData = await empleadoService.getAllEmpleados();
        setEmpleados(empleadosData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos. Por favor, inténtalo de nuevo.');
        
        // Datos de demostración en caso de error
        setEmpleados([
          { 
            id: 1, 
            nombre: 'Juan', 
            apellido: 'Pérez', 
            email: 'juan@ejemplo.com', 
            rol: 'Supervisor', 
            telefono: '555-1234',
            estado: true
          },
          { 
            id: 2, 
            nombre: 'María', 
            apellido: 'González', 
            email: 'maria@ejemplo.com', 
            rol: 'Cajero', 
            telefono: '555-5678',
            estado: false
          },
          { 
            id: 3, 
            nombre: 'Carlos', 
            apellido: 'Rodríguez', 
            email: 'carlos@ejemplo.com', 
            rol: 'Gestor de Inventario', 
            telefono: '555-9012',
            estado: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tienePermiso]);

  // Filtrar empleados por término de búsqueda
  const filteredEmpleados = empleados.filter(empleado => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Convertir el ID del rol a su nombre usando el mapeo dinámico
    const rolNombre = rolMapping[empleado.rol] || 'Rol no asignado';
    
    return (
      empleado.nombre?.toLowerCase().includes(searchTermLower) ||
      (empleado.apellido && empleado.apellido.toLowerCase().includes(searchTermLower)) ||
      empleado.correo?.toLowerCase().includes(searchTermLower) ||
      rolNombre.toLowerCase().includes(searchTermLower) ||
      (empleado.telefono && empleado.telefono.includes(searchTerm))
    );
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmpleados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmpleados.length / itemsPerPage);

  // Navegar a la página para crear un nuevo empleado
  const handleCreateEmpleado = () => {
    navigate('/admin/empleados/crear');
  };

  // Navegar a la página de edición
  const handleEditEmpleado = (id) => {
    navigate(`/admin/empleados/editar/${id}`);
  };

  // Cambiar estado del empleado
  const handleToggleEstado = async (id, nombre, estadoActual) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    
    if (window.confirm(`¿Está seguro que desea ${accion} al empleado ${nombre}?`)) {
      try {
        // Llamamos al servicio con el estado opuesto al actual
        await empleadoService.toggleEmpleadoEstado(id, !estadoActual);
        
        // Actualizamos el estado en la interfaz
        setEmpleados(empleados.map(emp => 
          emp.id === id ? { ...emp, estado: !estadoActual } : emp
        ));
        
        alert(`Empleado ${accion === 'activar' ? 'activado' : 'desactivado'} con éxito`);
      } catch (error) {
        console.error(`Error al ${accion} empleado:`, error);
        alert(`Error al ${accion} el empleado`);
      }
    }
  };

  // Si el usuario no tiene permiso para ver empleados, mostrar mensaje
  if (!permisosLoading && !tienePermiso('ver_empleados')) {
    return (
      <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
        <div className="text-center text-red-600 py-8">
          <FaUserCircle className="mx-auto text-6xl mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permiso para acceder a la gestión de empleados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
        
        {/* Solo mostrar botón de crear si tiene permiso */}
        {tienePermiso('agregar_empleados') && (
          <button
            onClick={handleCreateEmpleado}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FaPlus /> Nuevo Empleado
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar empleado..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Tabla de empleados */}
      {loading || permisosLoading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2">Cargando empleados...</p>
        </div>
      ) : (
        <>
          {currentItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No se encontraron empleados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    
                    {/* Mostrar columna de acciones solo si tiene algún permiso de acción */}
                    {(tienePermiso('editar_empleado') || tienePermiso('eliminar_empleado')) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {empleado.nombre} {empleado.apellido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{empleado.correo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rolMapping[empleado.rol] || empleado.rol || 'Rol no asignado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{empleado.telefono || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          empleado.estado 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      
                      {/* Mostrar acciones solo si tiene algún permiso */}
                      {(tienePermiso('editar_empleado') || tienePermiso('eliminar_empleado')) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* Solo mostrar botón de editar si tiene permiso */}
                            {tienePermiso('editar_empleado') && (
                              <button 
                                onClick={() => handleEditEmpleado(empleado.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar"
                              >
                                <FaEdit />
                              </button>
                            )}
                            
                            {/* Solo mostrar botón de activar/desactivar si tiene permiso */}
                            {tienePermiso('eliminar_empleado') && (
                              <button 
                                onClick={() => handleToggleEstado(empleado.id, empleado.nombre, empleado.estado)}
                                className={empleado.estado ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                                title={empleado.estado ? "Desactivar" : "Activar"}
                              >
                                {empleado.estado ? <FaBan /> : <FaUserCheck />}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Empleados;