import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { empleadoService } from '../../services/EmpleadoService';

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null); // Agregamos state para manejar errores
  const navigate = useNavigate();

  // Mapeo de roles
  const rolMapping = {
    1: "Supervisor",
    2: "Cajero",
    3: "Gestor de Inventario"
  };

  // Cargar empleados al montar el componente
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setLoading(true);
        setError(null); // Reiniciar errores previos
        const data = await empleadoService.getAllEmpleados();
        setEmpleados(data);
      } catch (error) {
        console.error('Error al cargar empleados:', error);
        setError('No se pudieron cargar los empleados. Por favor, inténtalo de nuevo.');
        // Datos de demostración en caso de error
        setEmpleados([
          { 
            id: 1, 
            nombre: 'Juan', 
            apellido: 'Pérez', 
            email: 'juan@ejemplo.com', 
            rol: 'Supervisor', 
            telefono: '555-1234' 
          },
          { 
            id: 2, 
            nombre: 'María', 
            apellido: 'González', 
            email: 'maria@ejemplo.com', 
            rol: 'Cajero', 
            telefono: '555-5678' 
          },
          { 
            id: 3, 
            nombre: 'Carlos', 
            apellido: 'Rodríguez', 
            email: 'carlos@ejemplo.com', 
            rol: 'Gestor de Inventario', 
            telefono: '555-9012' 
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpleados();
  }, []);

  // Filtrar empleados por término de búsqueda
  const filteredEmpleados = empleados.filter(empleado => 
    empleado.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.rol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Eliminar un empleado
  const handleDeleteEmpleado = async (id, nombre) => {
    if (window.confirm(`¿Está seguro que desea eliminar al empleado ${nombre}?`)) {
      try {
        await empleadoService.deleteEmpleado(id);
        setEmpleados(empleados.filter(emp => emp.id !== id));
        alert('Empleado eliminado con éxito');
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
        alert('Error al eliminar el empleado');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
        <button
          onClick={handleCreateEmpleado}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> Nuevo Empleado
        </button>
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
      {loading ? (
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
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditEmpleado(empleado.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmpleado(empleado.id, empleado.nombre)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
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
    </div>
  );
};

export default Empleados;