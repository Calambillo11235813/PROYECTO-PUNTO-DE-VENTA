import React, { useState, useEffect } from "react";
import { useOutletContext } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  Search, 
  PlusCircle, 
  UserCheck, 
  UserX 
} from "lucide-react";
import "./Users.css";

// Datos de ejemplo para clientes
const initialClients = [
  { 
    id: 1, 
    name: 'Juan Pérez', 
    email: 'juan@example.com', 
    phone: '555-123-4567',
    type: 'Frecuente',
    status: 'Activo',
    lastPurchase: '2023-04-25',
    totalPurchases: 2450.50
  },
  { 
    id: 2, 
    name: 'María López', 
    email: 'maria@example.com',
    phone: '555-765-4321',
    type: 'Regular',
    status: 'Activo',
    lastPurchase: '2023-04-24',
    totalPurchases: 1850.75
  },
  { 
    id: 3, 
    name: 'Carlos Gómez', 
    email: 'carlos@example.com', 
    phone: '555-987-6543',
    type: 'Empresa',
    status: 'Inactivo',
    lastPurchase: '2023-04-20',
    totalPurchases: 5430.25
  },
  { 
    id: 4, 
    name: 'Ana Martínez', 
    email: 'ana@example.com',
    phone: '555-234-5678',
    type: 'Regular',
    status: 'Activo',
    lastPurchase: '2023-04-25',
    totalPurchases: 750.00
  },
  { 
    id: 5, 
    name: 'Roberto Díaz', 
    email: 'roberto@example.com',
    phone: '555-876-5432',
    type: 'Empresa',
    status: 'Activo',
    lastPurchase: '2023-04-23',
    totalPurchases: 3250.80
  }
];

const Users = () => {
  // Obtenemos el contexto del AdminLayout
  const [darkMode, toggleDarkMode, activePage, setActivePage] = useOutletContext();

  // Configuramos el título de la página
  useEffect(() => {
    setActivePage("Gestión de Clientes");
  }, [setActivePage]);

  const [clients, setClients] = useState(initialClients);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Regular",
    status: "Activo",
    lastPurchase: "",
    totalPurchases: 0
  });
  const [activeTab, setActiveTab] = useState("all");
  const [clientTypes, setClientTypes] = useState([]);

  useEffect(() => {
    const uniqueTypes = [...new Set(clients.map((client) => client.type))];
    setClientTypes(uniqueTypes);
  }, [clients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "inactive") return matchesSearch && client.status === "Inactivo";
    return matchesSearch && client.type === activeTab;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === "totalPurchases" ? parseFloat(value) : value;
    setNewClient({ ...newClient, [name]: parsedValue });
  };

  const handleSaveClient = () => {
    if (editingClient) {
      setClients(
        clients.map((c) =>
          c.id === editingClient.id ? { ...newClient, id: c.id } : c
        )
      );
    } else {
      const id = Math.max(...clients.map((c) => c.id), 0) + 1;
      setClients([...clients, { ...newClient, id }]);
    }
    setShowModal(false);
    setEditingClient(null);
    setNewClient({
      name: "",
      email: "",
      phone: "",
      type: "Regular",
      status: "Activo",
      lastPurchase: "",
      totalPurchases: 0
    });
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setNewClient({ ...client });
    setShowModal(true);
  };

  const handleDeleteClient = (id) => {
    setClients(clients.filter((c) => c.id !== id));
  };

  const activeClientsCount = clients.filter((c) => c.status === "Activo").length;
  const inactiveClientsCount = clients.filter((c) => c.status === "Inactivo").length;

  return (
    <div className="clients-content">
      {/* Estadísticas */}
      <div className="clients-stats">
        <div className="stat-card">
          <h3>Total de Clientes</h3>
          <p>{clients.length}</p>
          <div className="icon-container">
            <UsersIcon size={24} />
          </div>
        </div>
        <div className="stat-card">
          <h3>Clientes Activos</h3>
          <p>{activeClientsCount}</p>
          <div className="icon-container">
            <UserCheck size={24} />
          </div>
        </div>
        <div className="stat-card">
          <h3>Clientes Inactivos</h3>
          <p>{inactiveClientsCount}</p>
          <div className="icon-container">
            <UserX size={24} />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="clients-controls">
        <div className="search-container">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="add-client-btn"
          onClick={() => {
            setEditingClient(null);
            setNewClient({
              name: "",
              email: "",
              phone: "",
              type: "Regular",
              status: "Activo",
              lastPurchase: "",
              totalPurchases: 0
            });
            setShowModal(true);
          }}
        >
          <PlusCircle size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Tabs */}
      <div className="clients-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          Todos
        </button>
        <button
          className={activeTab === "inactive" ? "active" : ""}
          onClick={() => setActiveTab("inactive")}
        >
          Inactivos
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
      </div>

      {/* Tabla */}
      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Última Compra</th>
              <th>Total Compras</th>
              <th className="texto-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className={
                    client.status === "Inactivo" ? "inactive-client" : ""
                  }
                >
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
                  <td>{client.lastPurchase}</td>
                  <td>${client.totalPurchases.toFixed(2)}</td>
                  <td className="actions-cell">
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                name="name"
                value={newClient.name}
                onChange={handleInputChange}
                placeholder="Nombre Completo"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={newClient.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="phone"
                value={newClient.phone}
                onChange={handleInputChange}
                placeholder="Teléfono"
              />
            </div>
            <div className="form-row">
              <div className="form-group half">
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
              <div className="form-group half">
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
            </div>
            {editingClient && (
              <>
                <div className="form-group">
                  <label>Última Compra</label>
                  <input
                    type="date"
                    name="lastPurchase"
                    value={newClient.lastPurchase}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Total Compras ($)</label>
                  <input
                    type="number"
                    name="totalPurchases"
                    value={newClient.totalPurchases}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </>
            )}
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button className="save-btn" onClick={handleSaveClient}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;