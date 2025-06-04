import React, { useState, useEffect } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaUserCircle } from "react-icons/fa";
import clienteService from "../../services/clienteService";
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
    fetchClientes();
  }, []);

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

  return (
    <div style={{ backgroundColor: "var(--bg-tertiary)" }}className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold title-icon dark:text-gray">Gestión de Clientes</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
        >
          <FaUserPlus className="mr-2" /> Nuevo Cliente
        </button>
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

      {loading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando clientes...</span>
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
      />

      {/* Confirmación para eliminar cliente */}
      <DeleteConfirmation
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        clienteName={clienteToDelete?.nombre || ""}
        isDeleting={deleting}
      />
    </div>
  );
};

export default Clientes;