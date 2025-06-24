import React, { useEffect, useState } from "react";
import proveedorService from "../services/proveedorService";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const Proveedor = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProveedor, setEditProveedor] = useState(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "" });
  const usuarioId = localStorage.getItem("id");

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const data = await proveedorService.getProveedoresByUsuario(usuarioId);
      setProveedores(data);
    } catch (error) {
      alert("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, [usuarioId]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEditProveedor(null);
    setForm({ nombre: "", telefono: "", correo: "" });
    setShowForm(true);
  };

  const handleEdit = (prov) => {
    setEditProveedor(prov);
    setForm({ nombre: prov.nombre, telefono: prov.telefono, correo: prov.correo });
    setShowForm(true);
  };

  const handleDelete = async (prov) => {
    if (window.confirm(`¿Eliminar proveedor "${prov.nombre}"?`)) {
      try {
        await proveedorService.eliminarProveedor(prov.id, usuarioId);
        fetchProveedores();
      } catch {
        alert("Error al eliminar proveedor");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProveedor) {
        await proveedorService.editarProveedor(editProveedor.id, usuarioId, form);
      } else {
        await proveedorService.crearProveedor(usuarioId, form);
      }
      setShowForm(false);
      fetchProveedores();
    } catch {
      alert("Error al guardar proveedor");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray">Proveedores</h2>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleAdd}
        >
          <FaPlus /> Nuevo Proveedor
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded shadow">
          <div className="flex gap-4 mb-2">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleInputChange}
              placeholder="Nombre"
              className="p-2 border rounded w-full"
              required
            />
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleInputChange}
              placeholder="Teléfono"
              className="p-2 border rounded w-full"
            />
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleInputChange}
              placeholder="Correo"
              className="p-2 border rounded w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editProveedor ? "Actualizar" : "Guardar"}
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="text-gray-600">Cargando proveedores...</div>
      ) : (
        <table className="min-w-full border border-gray-200 dark:border-gray-600">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">Nombre</th>
              <th className="px-4 py-2 border-b">Teléfono</th>
              <th className="px-4 py-2 border-b">Correo</th>
              <th className="px-4 py-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((prov) => (
              <tr key={prov.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-2 border-b">{prov.id}</td>
                <td className="px-4 py-2 border-b">{prov.nombre}</td>
                <td className="px-4 py-2 border-b">{prov.telefono}</td>
                <td className="px-4 py-2 border-b">{prov.correo}</td>
                <td className="px-4 py-2 border-b flex gap-2">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleEdit(prov)}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(prov)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Proveedor;