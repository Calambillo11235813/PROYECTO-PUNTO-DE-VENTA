import React, { useState, useEffect, useCallback } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaUserCircle } from "react-icons/fa";
import clienteService from "../../services/clienteService";
import permisoService from "../../services/permisoService";
import ClienteForm from "./ClienteForm";
import DeleteConfirmation from "./DeleteConfirmation";

const Clientes = () => {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userPermisos, setUserPermisos] = useState([]);
  const [permisosLoading, setPermisosLoading] = useState(true);

  // Cargar los permisos del usuario
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        setPermisosLoading(true);
        
        // Verificar si es administrador
        const userType = localStorage.getItem('user_type');
        if (userType === 'usuario') {
          // Administrador tiene todos los permisos
          setUserPermisos(['agregar_cliente', 'editar_cliente', 'eliminar_cliente', 'ver_clientes']);
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
    if (permisoRequerido === '*') return true; // Permiso especial que todos pueden ver
    
    // Si es usuario admin (puedes identificarlo por un permiso especial)
    if (userPermisos.includes('admin_acceso_total')) return true;
    
    // Verificar si el usuario tiene el permiso específico
    return userPermisos.includes(permisoRequerido);
  }, [userPermisos]); // userPermisos como dependencia

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const fetchedData = await clienteService.getAllClientes();
      setClientes(fetchedData);
      setFilteredClientes(fetchedData);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargar clientes si el usuario tiene permiso
    if (tienePermiso('ver_clientes')) {
      fetchClientes();
    } else {
      setLoading(false);
    }
  }, [tienePermiso]); // ahora tienePermiso no cambiará en cada renderizado

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.cedula_identidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  const handleClienteSaved = () => {
    // Refrescar la lista de clientes
    fetchClientes();
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentCliente(null);
    setShowModal(true);
  };

  const openEditModal = (cliente) => {
    setEditMode(true);
    setCurrentCliente(cliente);
    setShowModal(true);
  };

  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente);
    setDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;
    
    setDeleting(true);
    try {
      await clienteService.deleteCliente(clienteToDelete.id);
      console.log("Cliente eliminado con éxito:", clienteToDelete.id);
      
      // Actualizar la lista de clientes
      fetchClientes();
      
      setDeleteConfirmModal(false);
      setClienteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      alert("Error al eliminar el cliente. Por favor intente nuevamente.");
    } finally {
      setDeleting(false);
    }
  };

  // Si el usuario no tiene permiso para ver clientes, mostrar mensaje
  if (!permisosLoading && !tienePermiso('ver_clientes')) {
    return (
      <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
        <div className="text-center text-red-600 py-8">
          <FaUserCircle className="mx-auto text-6xl mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permiso para acceder a la gestión de clientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray">Gestión de Clientes</h2>
        
        {/* Mostrar botón de nuevo cliente solo si tiene permiso */}
        {tienePermiso('agregar_cliente') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <FaUserPlus className="mr-2" /> Nuevo Cliente
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading || permisosLoading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando información...</span>
          <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg">
          {searchTerm ? "No se encontraron clientes que coincidan con la búsqueda." : "No hay clientes registrados."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-600 text-center">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 border-b text-center">ID</th>
                <th className="px-4 py-2 border-b text-center">Nombre</th>
                <th className="px-4 py-2 border-b text-center">Cédula</th>
                <th className="px-4 py-2 border-b text-center">Teléfono</th>
                <th className="px-4 py-2 border-b text-center">Dirección</th>
                <th className="px-4 py-2 border-b text-center">Email</th>
                
                {/* Mostrar columna de acciones solo si tiene algún permiso de acción */}
                {(tienePermiso('editar_cliente') || tienePermiso('eliminar_cliente')) && (
                  <th className="px-4 py-2 border-b text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 border-b text-center">{cliente.id}</td>
                  <td className="px-4 py-2 border-b text-center">{cliente.nombre}</td>
                  <td className="px-4 py-2 border-b text-center">{cliente.cedula_identidad || "-"}</td>
                  <td className="px-4 py-2 border-b text-center">{cliente.telefono || "-"}</td>
                  <td className="px-4 py-2 border-b text-center">
                    {cliente.direccion ? 
                      (cliente.direccion.length > 25 ? 
                        `${cliente.direccion.substring(0, 25)}...` : 
                        cliente.direccion) : 
                      "-"}
                  </td>
                  <td className="px-4 py-2 border-b text-center">{cliente.email || "-"}</td>
                  
                  {/* Mostrar celda de acciones solo si tiene algún permiso de acción */}
                  {(tienePermiso('editar_cliente') || tienePermiso('eliminar_cliente')) && (
                    <td className="px-4 py-2 border-b">
                      <div className="flex justify-center space-x-2">
                        {/* Mostrar botón de editar solo si tiene permiso */}
                        {tienePermiso('editar_cliente') && (
                          <button
                            onClick={() => openEditModal(cliente)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                            title="Editar cliente"
                          >
                            <FaEdit className="mr-1" /> Editar
                          </button>
                        )}
                        
                        {/* Mostrar botón de eliminar solo si tiene permiso */}
                        {tienePermiso('eliminar_cliente') && (
                          <button
                            onClick={() => handleDeleteClick(cliente)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                            title="Eliminar cliente"
                          >
                            <FaTrash className="mr-1" /> Eliminar
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

      {/* Formulario para añadir/editar cliente - Solo mostrar si tiene el permiso correspondiente */}
      {((editMode && tienePermiso('editar_cliente')) || (!editMode && tienePermiso('agregar_cliente'))) && (
        <ClienteForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editMode={editMode}
          currentCliente={currentCliente}
          onClienteSaved={handleClienteSaved}
        />
      )}

      {/* Confirmación para eliminar cliente - Solo mostrar si tiene permiso */}
      {tienePermiso('eliminar_cliente') && (
        <DeleteConfirmation
          isOpen={deleteConfirmModal}
          onClose={() => setDeleteConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          clienteName={clienteToDelete?.nombre || ""}
          isDeleting={deleting}
        />
      )}
    </div>
  );
};

export default Clientes;