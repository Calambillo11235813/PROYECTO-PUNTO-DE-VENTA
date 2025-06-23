import React, { useState, useEffect } from 'react';
import { FaUser, FaStore } from 'react-icons/fa';
import clienteService from '../../services/clienteService';

const ClienteForm = ({ 
  isOpen, 
  onClose, 
  editMode = false, 
  currentCliente = null, 
  onClienteSaved,
  selectedSucursal = null
}) => {
  const [formCliente, setFormCliente] = useState({
    nombre: "",
    cedula_identidad: "",
    telefono: "",
    direccion: "",
    email: "",
    sucursal: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editMode && currentCliente) {
        setFormCliente({
          nombre: currentCliente.nombre || "",
          cedula_identidad: currentCliente.cedula_identidad || "",
          telefono: currentCliente.telefono || "",
          direccion: currentCliente.direccion || "",
          email: currentCliente.email || "",
          sucursal: currentCliente.sucursal || null,
        });
      } else {
        // Resetear el formulario si estamos creando un nuevo cliente
        const sucursalId = selectedSucursal?.id || localStorage.getItem('sucursal_actual_id') || null;
        
        setFormCliente({
          nombre: "",
          cedula_identidad: "",
          telefono: "",
          direccion: "",
          email: "",
          sucursal: sucursalId ? parseInt(sucursalId) : null,
        });
        
        if (sucursalId) {
          console.log(`📋 Inicializando formulario con sucursal ID: ${sucursalId}`);
        }
      }
      // Limpiar errores
      setErrors({});
    }
  }, [isOpen, editMode, currentCliente, selectedSucursal]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formCliente.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    
    if (formCliente.email && !/^\S+@\S+\.\S+$/.test(formCliente.email)) {
      newErrors.email = "El formato de email no es válido";
    }
    
    if (formCliente.cedula_identidad && !/^[0-9]+$/.test(formCliente.cedula_identidad)) {
      newErrors.cedula_identidad = "La cédula debe contener solo números";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormCliente({
      ...formCliente,
      [name]: value
    });
    
    // Limpiar error del campo si el usuario está escribiendo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Asegurar que se envíe la sucursal
      const sucursalId = formCliente.sucursal || 
                         selectedSucursal?.id || 
                         localStorage.getItem('sucursal_actual_id');
      
      const dataToSubmit = {
        ...formCliente,
        sucursal: sucursalId ? parseInt(sucursalId) : null
      };
      
      console.log(`📤 Enviando formulario con datos:`, dataToSubmit);
      
      if (editMode) {
        // Actualizar cliente existente
        await clienteService.updateCliente(currentCliente.id, dataToSubmit);
      } else {
        // Crear nuevo cliente
        await clienteService.createCliente(dataToSubmit);
      }
      
      // Notificar al componente padre que se ha guardado un cliente
      onClienteSaved();
      
      // Cerrar el modal
      onClose();
      
    } catch (error) {
      console.error(`Error al ${editMode ? 'actualizar' : 'crear'} el cliente:`, error);
      alert(`Error al ${editMode ? 'actualizar' : 'crear'} el cliente. Por favor intente nuevamente.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div style={{ backgroundColor: "var(--bg-tertiary)" }}className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {editMode ? "Editar Cliente" : "Nuevo Cliente"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Mostrar información de la sucursal */}
        {(selectedSucursal || localStorage.getItem('sucursal_actual_nombre')) && (
          <div className="mb-4 p-2 bg-purple-50 border border-purple-200 rounded flex items-center">
            <FaStore className="text-purple-500 mr-2" />
            <div>
              <p className="text-xs text-purple-700">Cliente será registrado en la sucursal:</p>
              <p className="font-medium text-purple-800">
                {selectedSucursal?.nombre || localStorage.getItem('sucursal_actual_nombre')}
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formCliente.nombre}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.nombre ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Cédula de Identidad</label>
              <input
                type="text"
                name="cedula_identidad"
                value={formCliente.cedula_identidad}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.cedula_identidad ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cedula_identidad && (
                <p className="text-red-500 text-sm mt-1">{errors.cedula_identidad}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formCliente.telefono}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <textarea
                name="direccion"
                value={formCliente.direccion}
                onChange={handleInputChange}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formCliente.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                editMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? "Guardando..." : editMode ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;