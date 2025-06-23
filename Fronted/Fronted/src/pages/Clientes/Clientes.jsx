import React, { useState, useEffect } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaUserCircle, FaStore } from "react-icons/fa";
import clienteService from "../../services/clienteService";
import sucursalService from "../../services/SucursalService";
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

  // Nuevos estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [showSucursalSelector, setShowSucursalSelector] = useState(false);

  // Obtener el ID del usuario y la sucursal actual del localStorage
  const userId = localStorage.getItem('id');
  const currentSucursalId = localStorage.getItem('sucursal_actual_id');
  const currentSucursalName = localStorage.getItem('sucursal_actual_nombre');

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

  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      let data;
      if (selectedSucursal) {
        // Cargar clientes específicos de la sucursal seleccionada
        console.log(`🔍 Buscando clientes específicos para la sucursal: ${selectedSucursal.id}`);
        data = await clienteService.getClientesBySucursal(userId, selectedSucursal.id);
        console.log('📋 Clientes obtenidos para la sucursal:', data);
      } else if (currentSucursalId) {
        // Usar la sucursal actual del localStorage
        console.log(`🔍 Usando sucursal actual del localStorage: ${currentSucursalId}`);
        data = await clienteService.getClientesBySucursal(userId, currentSucursalId);
        console.log('📋 Clientes obtenidos para la sucursal actual:', data);
      } else {
        // Cargar todos los clientes (comportamiento original)
        console.log('🔍 Cargando todos los clientes (sin filtro de sucursal)');
        data = await clienteService.getAllClientes();
      }
      
      setClientes(data);
      applySearch(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [selectedSucursal, currentSucursalId]);

  // Función para aplicar el filtro de búsqueda
  const applySearch = (clientesArray) => {
    if (searchTerm.trim() === "") {
      setFilteredClientes(clientesArray);
    } else {
      const filtered = clientesArray.filter(
        (cliente) =>
          cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.cedula_identidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  };

  useEffect(() => {
    applySearch(clientes);
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

  // Manejar selección de sucursal
  const handleSucursalChange = (sucursal) => {
    setSelectedSucursal(sucursal);
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    setShowSucursalSelector(false);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-tertiary)" }}className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold title-icon dark:text-gray">Gestión de Clientes</h2>
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
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <FaUserPlus className="mr-2" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Información de sucursal actual */}
      {selectedSucursal && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <FaStore className="text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Mostrando clientes de la sucursal:</p>
              <p className="font-semibold text-blue-800">{selectedSucursal.nombre}</p>
            </div>
          </div>
        </div>
      )}

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

      {loading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando clientes...</span>
          <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg py-8">
          {searchTerm 
            ? "No se encontraron clientes que coincidan con la búsqueda." 
            : selectedSucursal 
              ? `No hay clientes registrados en la sucursal "${selectedSucursal.nombre}".` 
              : "No hay clientes registrados."}
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
                <th className="px-4 py-2 border-b text-center">Sucursal</th>
                <th className="px-4 py-2 border-b text-center">Acciones</th>
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
                  <td className="px-4 py-2 border-b text-center">
                    {cliente.sucursal_nombre ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {cliente.sucursal_nombre}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => openEditModal(cliente)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                        title="Editar cliente"
                      >
                        <FaEdit className="mr-1" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cliente)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                        title="Eliminar cliente"
                      >
                        <FaTrash className="mr-1" /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulario para añadir/editar cliente */}
      <ClienteForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editMode={editMode}
        currentCliente={currentCliente}
        onClienteSaved={handleClienteSaved}
        selectedSucursal={selectedSucursal}
      />

      {/* Confirmación para eliminar cliente */}
      <DeleteConfirmation
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        clienteName={clienteToDelete?.nombre || ""}
        isDeleting={deleting}
      />

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

export default Clientes;