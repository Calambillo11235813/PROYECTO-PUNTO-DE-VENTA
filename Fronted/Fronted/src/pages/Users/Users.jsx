import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users as UsersIcon,
  Search,
  PlusCircle,
  UserCheck,
  UserX,
} from "lucide-react";

import userService from "../../services/userService"; // Importamos el servicio
import "./Users.css";

const Users = () => {
  // Obtenemos el contexto del AdminLayout
  const [darkMode, toggleDarkMode, activePage, setActivePage] =
    useOutletContext();

  // Configuramos el título de la página
  useEffect(() => {
    setActivePage("Gestión de Clientes");
  }, [setActivePage]);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Regular",
    status: "Activo",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [clientTypes, setClientTypes] = useState([]);

  // Cargamos los clientes desde el API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Verificar token antes de hacer la petición
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError("No hay token de autenticación disponible. Por favor inicie sesión nuevamente.");
          setLoading(false);
          return;
        }

        console.log("Token disponible para autenticación:", token.substring(0, 20) + "...");
        
        setLoading(true);
        const usersData = await userService.getAllUsers();

        if (!usersData || usersData.length === 0) {
          setClients([]);
          setError("No hay usuarios disponibles");
          return;
        }

        // Transformamos los datos del backend al formato que espera nuestro componente
        const transformedClients = usersData.map((user) => ({
          id: user.id,
          name: user.nombre,
          email: user.correo,
          phone: user.direccion || "No disponible",
          type: user.rol?.nombre_rol || "Regular",
          status: user.estado ? "Activo" : "Inactivo",
          lastPurchase: "",
          totalPurchases: 0,
        }));

        setClients(transformedClients);
        setError(null);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
        setError(
          "Error al cargar los datos: " + (err.message || "Error desconocido")
        );

        // Datos de prueba para desarrollo
        setClients([
          {
            id: 1,
            name: "Usuario Ejemplo",
            email: "usuario@example.com",
            phone: "555-1234",
            type: "Regular",
            status: "Activo",
            lastPurchase: "2023-10-15",
            totalPurchases: 150,
          },
          {
            id: 2,
            name: "Cliente Premium",
            email: "premium@example.com",
            phone: "555-5678",
            type: "Frecuente",
            status: "Activo",
            lastPurchase: "2023-10-25",
            totalPurchases: 1200,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Resto del código permanece igual...
  // Aquí está el resto del componente
  // ...
  
  // Extraemos los tipos de cliente únicos
  useEffect(() => {
    const uniqueTypes = [...new Set(clients.map((client) => client.type))];
    setClientTypes(uniqueTypes);
  }, [clients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone &&
        client.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "inactive")
      return matchesSearch && client.status === "Inactivo";
    return matchesSearch && client.type === activeTab;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === "totalPurchases" ? parseFloat(value) : value;
    setNewClient({ ...newClient, [name]: parsedValue });
  };

  const handleSaveClient = async () => {
    try {
      setLoading(true);

      if (editingClient) {
        // Actualizar cliente existente
        await userService.updateUser(editingClient.id, newClient);

        setClients(
          clients.map((c) =>
            c.id === editingClient.id ? { ...newClient, id: c.id } : c
          )
        );
      } else {
        // Crear nuevo cliente
        const createdClient = await userService.createUser(newClient);

        // Transformamos la respuesta al formato del componente
        const transformedClient = {
          id: createdClient.id,
          name: createdClient.nombre,
          email: createdClient.correo,
          phone: createdClient.direccion || "No disponible",
          type: createdClient.rol?.nombre_rol || "Regular",
          status: createdClient.estado ? "Activo" : "Inactivo",
          lastPurchase: "",
          totalPurchases: 0,
        };

        setClients([...clients, transformedClient]);
      }

      setShowModal(false);
      setEditingClient(null);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        type: "Regular",
        status: "Activo",
      });
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setError("Error al guardar los datos. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setNewClient({ ...client });
    setShowModal(true);
  };

  const handleDeleteClient = async (id) => {
    try {
      setLoading(true);
      await userService.deleteUser(id);
      setClients(clients.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      setError("Error al eliminar el cliente. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const activeClientsCount = clients.filter(
    (c) => c.status === "Activo"
  ).length;
  const inactiveClientsCount = clients.filter(
    (c) => c.status === "Inactivo"
  ).length;

  // Si está cargando, mostramos un indicador
  if (loading && clients.length === 0) {
    return <div className="loading-indicator">Cargando clientes...</div>;
  }

  // Si hay un error, lo mostramos
  if (error && clients.length === 0) {
    return <div className="error-message">{error}</div>;
  }

  // Contenido principal del componente
  return (
    <div className={`clients-content ${darkMode ? 'dark-mode' : ''}`}>
      {error && <div className="error-message">{error}</div>}
      
      {/* Estadísticas */}
      <div className="clients-stats">
        <div className="stat-card">
          <div className="icon-container">
            <UsersIcon size={24} />
          </div>
          <h3>Total Clientes</h3>
          <p>{clients.length}</p>
        </div>
        <div className="stat-card">
          <div className="icon-container">
            <UserCheck size={24} />
          </div>
          <h3>Clientes Activos</h3>
          <p>{activeClientsCount}</p>
        </div>
        <div className="stat-card">
          <div className="icon-container">
            <UserX size={24} />
          </div>
          <h3>Clientes Inactivos</h3>
          <p>{inactiveClientsCount}</p>
        </div>
      </div>

      {/* Búsqueda y controles */}
      <div className="clients-controls">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-client-btn" onClick={() => {
          setEditingClient(null);
          setNewClient({
            name: "",
            email: "",
            phone: "",
            type: "Regular",
            status: "Activo"
          });
          setShowModal(true);
        }}>
          <PlusCircle size={20} /> Nuevo Cliente
        </button>
      </div>

      {/* Tabs de filtrado */}
      <div className="clients-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          Todos
        </button>
        {clientTypes.map((type) => (
          <button
            key={type}
            className={activeTab === type ? "active" : ""}
            onClick={() => setActiveTab(type)}
          >
            {type}
          </button>
        ))}
        <button
          className={activeTab === "inactive" ? "active" : ""}
          onClick={() => setActiveTab("inactive")}
        >
          Inactivos
        </button>
      </div>

      {/* Tabla de clientes */}
      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id} className={client.status === "Inactivo" ? "inactive-client" : ""}>
                  <td>{client.id}</td>
                  <td>{client.name}</td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td>
                    <span className={`type-badge ${client.type.toLowerCase()}`}>
                      {client.type}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${client.status === "Activo" ? "active" : "inactive"}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditClient(client)}
                      >
                        Editar
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{textAlign: "center", padding: "2rem"}}>
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para añadir/editar cliente */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveClient();
            }}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  name="type"
                  value={newClient.type}
                  onChange={handleInputChange}
                >
                  <option value="Regular">Regular</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="status"
                  value={newClient.status}
                  onChange={handleInputChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;