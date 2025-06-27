import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import PlanLimitAlert from '../PlanLimitAlert';
import { useNavigate } from 'react-router-dom';

const SucursalForm = ({ sucursal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    horario: '',
    activa: true
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPlanLimitAlert, setShowPlanLimitAlert] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const navigate = useNavigate();
  
  // Cargar datos si es edición
  useEffect(() => {
    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        horario: sucursal.horario || '',
        activa: sucursal.activa !== false
      });
    }
  }, [sucursal]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar el error al modificar el campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es obligatoria';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('Por favor, complete correctamente todos los campos requeridos');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Preparar datos para envío
      const sucursalData = {
        ...formData,
        // Convertir campos vacíos a null
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        horario: formData.horario.trim() || null
      };
      
      console.log('📤 Datos de sucursal a guardar:', sucursalData);
      
      // Llamar a la función onSave que manejará la creación/actualización
      await onSave(sucursalData);
      
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      
      // Verificación mejorada para detectar error de límite
      if (error.response && error.response.status === 403) {
        const data = error.response.data;
        setLimitMessage(
          data?.message ||
          data?.error ||
          "Has alcanzado el límite de tu plan."
        );
        setShowPlanLimitAlert(true);
        return;
      }
      
      // Si llegamos aquí, es otro tipo de error
      toast.error('Ocurrió un error al guardar la sucursal');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpgradePlan = () => {
    // Cerrar el modal de alerta
    setShowPlanLimitAlert(false);
    // Navegar a la página de planes
    navigate('/planes');
  };
  
  // Componente para depuración (solo en desarrollo)
  const DebugState = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <div className="fixed bottom-0 right-0 bg-black text-white p-2 text-xs opacity-50">
        showAlert: {showPlanLimitAlert ? 'true' : 'false'}
      </div>
    );
  };
  
  return (
    <div>
      {/* ALERTA DE LÍMITE DE PLAN */}
      <PlanLimitAlert
        isOpen={showPlanLimitAlert}
        message={limitMessage}
        onClose={() => setShowPlanLimitAlert(false)}
        onUpgrade={handleUpgradePlan}
      />

      {/* Solo muestra el formulario si NO hay alerta */}
      {!showPlanLimitAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button 
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.nombre ? 'border-red-300' : ''
                    }`}
                    placeholder="Ej: Sucursal Centro"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.direccion ? 'border-red-300' : ''
                    }`}
                    placeholder="Ej: Calle 10 #123"
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: +591 77777777"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                    placeholder="Ej: sucursal@empresa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Horario
                  </label>
                  <input
                    type="text"
                    name="horario"
                    value={formData.horario}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: Lun-Vie 8:00-18:00"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="activa"
                    name="activa"
                    type="checkbox"
                    checked={formData.activa}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="activa" className="ml-2 block text-sm text-gray-900">
                    Sucursal activa
                  </label>
                </div>
              </div>
              
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DebugState />
    </div>
  );
};

SucursalForm.propTypes = {
  sucursal: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SucursalForm;