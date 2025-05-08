import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { empleadoService } from '../../services/EmpleadoService';

const EmpleadoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: '', // Añadir campo de rol
    direccion: '',
    fecha_contratacion: '',
    contraseña: '' // Nuevo campo para contraseña
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar la visibilidad de la contraseña

  useEffect(() => {
    if (isEditing) {
      const fetchEmpleado = async () => {
        try {
          setLoading(true);
          const data = await empleadoService.getEmpleadoById(id);
          
          // Separar el nombre completo en nombre y apellido
          const nombreCompleto = data.nombre || '';
          let nombrePartes = nombreCompleto.split(' ');
          
          // La primera palabra es el nombre, el resto es apellido
          let primerNombre = nombrePartes[0] || '';
          let apellido = nombrePartes.slice(1).join(' ');
          
          setFormData({
            nombre: primerNombre,
            apellido: apellido,
            email: data.correo || '',
            telefono: data.telefono || '',
            rol: data.rol || '',
            direccion: data.direccion || '',
            fecha_contratacion: data.fecha_contratacion ? data.fecha_contratacion.split('T')[0] : '',
            contraseña: '' // Mantener contraseña en blanco al editar
          });
        } catch (error) {
          console.error('Error al cargar datos del empleado:', error);
          setError('No se pudo cargar la información del empleado');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEmpleado();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Datos adaptados al formato esperado por la API
      const empleadoData = {
        nombre: `${formData.nombre} ${formData.apellido}`.trim(), // Combinar nombre y apellido
        correo: formData.email,
        password: formData.contraseña,
        telefono: formData.telefono || "", 
        rol: formData.rol,
        direccion: formData.direccion || "",
        fecha_contratacion: formData.fecha_contratacion || null
      };
      

      
      console.log('Datos a enviar:', empleadoData);
      
      if (isEditing) {
        if (!empleadoData.password) {
          delete empleadoData.password;
        }
        
        await empleadoService.updateEmpleado(id, empleadoData);
        alert('Empleado actualizado con éxito');
      } else {
        await empleadoService.createEmpleado(empleadoData);
        alert('Empleado creado con éxito');
      }
      navigate('/admin/empleados');
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      
      if (error.response && error.response.data) {
        console.log('Respuesta detallada del error:', error.response.data);
        
        const errorMessages = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        
        setError(`Error al guardar: ${errorMessages}`);
      } else {
        setError('Error al guardar. Por favor, intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
        </h1>
        <button
          onClick={() => navigate('/admin/empleados')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft /> Volver
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apellido">
              Apellido *
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email * <span className="text-xs text-gray-500">(Se usará para iniciar sesión)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="telefono">
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rol">
              Rol en el Sistema *
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Cajero">Cajero</option>
              <option value="Gestion de inventario">Gestor de Inventario</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fecha_contratacion">
              Fecha de Contratación
            </label>
            <input
              type="date"
              id="fecha_contratacion"
              name="fecha_contratacion"
              value={formData.fecha_contratacion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contraseña">
              Contraseña {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                required={!isEditing} // Solo es requerido al crear un nuevo empleado
                minLength={6} // Asegurar contraseña mínimamente segura
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Dejar en blanco para mantener la contraseña actual.
              </p>
            )}
          </div>

          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="direccion">
              Dirección
            </label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/empleados')}
            className="px-4 py-2 mr-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>Guardando...</>
            ) : (
              <>
                <FaSave /> Guardar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmpleadoForm;