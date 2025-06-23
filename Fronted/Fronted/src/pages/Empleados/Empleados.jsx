import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaBan, FaUserCheck, FaSearch, FaStore } from 'react-icons/fa';
import { empleadoService } from '../../services/EmpleadoService';
import sucursalService from '../../services/SucursalService';

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Nuevos estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [showSucursalSelector, setShowSucursalSelector] = useState(false);

  // Obtener el ID del usuario del localStorage
  const userId = localStorage.getItem('id');
  const currentSucursalId = localStorage.getItem('sucursal_actual_id');
  const currentSucursalName = localStorage.getItem('sucursal_actual_nombre');

  // Mapeo de roles
  const rolMapping = {
    1: "Supervisor",
    2: "Cajero",
    3: "Gestor de Inventario"
  };

  // Cargar sucursales al montar el componente
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoadingSucursales(true);
        const data = await sucursalService.getSucursalesByUsuario(userId);
        setSucursales(data);

        // Establecer la sucursal seleccionada basada en localStorage
        if (currentSucursalId) {
          const current = data.find(suc => suc.id == currentSucursalId);
          if (current) {
            setSelectedSucursal(current);
          }
        }
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
      } finally {
        setLoadingSucursales(false);
      }
    };

    if (userId) {
      fetchSucursales();
    }
  }, [userId]);

  // Cargar empleados según la sucursal seleccionada
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setLoading(true);
        setError(null);

        let data;
        if (selectedSucursal) {
          // Cargar empleados específicos de la sucursal seleccionada
          console.log(`🔍 Buscando empleados específicos para la sucursal: ${selectedSucursal.id}`);
          data = await empleadoService.getEmpleadosBySucursal(userId, selectedSucursal.id);
          console.log('📋 Empleados obtenidos para la sucursal:', data);
        } else if (currentSucursalId) {
          // Usar la sucursal actual del localStorage
          console.log(`🔍 Usando sucursal actual del localStorage: ${currentSucursalId}`);
          data = await empleadoService.getEmpleadosBySucursal(userId, currentSucursalId);
          console.log('📋 Empleados obtenidos para la sucursal actual:', data);
        } else {
          // Cargar todos los empleados
          console.log('🔍 Cargando todos los empleados (sin filtro de sucursal)');
          data = await empleadoService.getAllEmpleados();
        }

        setEmpleados(data);
      } catch (error) {
        console.error('Error al cargar empleados:', error);
        setError('No se pudieron cargar los empleados. Por favor, inténtalo de nuevo.');
        setEmpleados([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEmpleados();
    }
  }, [userId, selectedSucursal, currentSucursalId]);

  // Filtrar empleados por término de búsqueda
  const filteredEmpleados = empleados.filter(empleado => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Convertir el ID del rol a su nombre usando el mapeo
    const rolNombre = rolMapping[empleado.rol] || empleado.rol || 'N/A';
    
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

  // Cambiar estado de empleado (activar/desactivar)
  const handleToggleEstado = async (id, nombre, estadoActual) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    
    if (window.confirm(`¿Está seguro que desea ${accion} al empleado ${nombre}?`)) {
      try {
        await empleadoService.toggleEmpleadoEstado(id, !estadoActual);
        
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

  // Manejar selección de sucursal
  const handleSucursalChange = (sucursal) => {
    setSelectedSucursal(sucursal);
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    setShowSucursalSelector(false);
    setCurrentPage(1); // Resetear paginación
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 title-icon">
        <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
        <div className="flex space-x-2">
          {/* Botón de selección de sucursal */}
          <button 
            onClick={() => setShowSucursalSelector(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FaStore /> 
            {selectedSucursal ? selectedSucursal.nombre : currentSucursalName || "Seleccionar Sucursal"}
          </button>

          <button
            onClick={handleCreateEmpleado}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FaPlus /> Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Información de sucursal actual */}
      {selectedSucursal && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <FaStore className="text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Mostrando empleados de la sucursal:</p>
              <p className="font-semibold text-blue-800">{selectedSucursal.nombre}</p>
            </div>
          </div>
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
      {loading ? (
        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="text-center py-10">
          <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2">Cargando empleados...</p>
        </div>
      ) : (
        <>
          {currentItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                {selectedSucursal 
                  ? `No hay empleados registrados en la sucursal "${selectedSucursal.nombre}"`
                  : "No se encontraron empleados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ backgroundColor: "var(--bg-tertiary)" }} className="min-w-full bg-white rounded-lg overflow-hidden">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
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
                        {rolMapping[empleado.rol] || empleado.rol || 'N/A'}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditEmpleado(empleado.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleToggleEstado(empleado.id, empleado.nombre, empleado.estado)}
                            className={empleado.estado ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                            title={empleado.estado ? "Desactivar" : "Activar"}
                          >
                            {empleado.estado ? <FaBan /> : <FaUserCheck />}
                          </button>
                        </div>
                      </td>
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

      {/* Modal de selección de sucursal */}
      {showSucursalSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Seleccionar Sucursal</h3>
              <button 
                onClick={() => setShowSucursalSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {loadingSucursales ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {sucursales.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No hay sucursales disponibles</p>
                ) : (
                  sucursales.map(sucursal => (
                    <button
                      key={sucursal.id}
                      onClick={() => handleSucursalChange(sucursal)}
                      className={`w-full text-left p-4 rounded mb-2 flex items-center ${
                        selectedSucursal && selectedSucursal.id === sucursal.id
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <FaStore className="mr-3 text-blue-600" />
                      <div>
                        <div className="font-medium">{sucursal.nombre}</div>
                        <div className="text-sm text-gray-500">{sucursal.direccion}</div>
                      </div>
                      {selectedSucursal && selectedSucursal.id === sucursal.id && (
                        <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Actual
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;