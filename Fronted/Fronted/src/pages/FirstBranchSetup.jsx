import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaStore, FaLocationArrow, FaPhone, FaEnvelope, FaClock, FaArrowRight } from 'react-icons/fa';
// Importar el servicio de sucursales
import sucursalService from '../services/SucursalService';

const FirstBranchSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sucursal, setSucursal] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    horario: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    activa: true
  });

  // Verificar si el usuario ya tiene sucursales
  useEffect(() => {
    const checkExistingBranches = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('FirstBranchSetup - Verificando sucursales existentes...');
        
        // Simplificar la verificación y manejo de redirección
        setLoading(false); // Mostrar el formulario independientemente
        
        // Solo verificar sin redirigir automáticamente
        const tieneSucursales = await sucursalService.hasSucursales();
        console.log('FirstBranchSetup - Tiene sucursales:', tieneSucursales);
        
        // La redirección se maneja en ProtectedRoute
      } catch (error) {
        console.error('FirstBranchSetup - Error:', error);
        setLoading(false);
      }
    };

    checkExistingBranches();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSucursal(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Usar el servicio para crear la sucursal y capturar la respuesta
      const sucursalCreada = await sucursalService.createSucursal(sucursal);

      // Guardar el ID de la sucursal en localStorage
      if (sucursalCreada && sucursalCreada.id) {
        localStorage.setItem('sucursal_actual_id', sucursalCreada.id);
        console.log('✅ ID de sucursal guardado en localStorage:', sucursalCreada.id);
        
        // También podemos guardar el nombre para usarlo en la interfaz
        localStorage.setItem('sucursal_actual_nombre', sucursalCreada.nombre);
      }

      toast.success('¡Sucursal creada con éxito!');
      
      // Breve pausa para mostrar el mensaje de éxito
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (error) {
      console.error('Error creando sucursal:', error);
      toast.error('Error al crear la sucursal. Por favor intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Configura tu primera sucursal</h1>
          <p className="text-lg text-gray-600">
            Antes de comenzar, necesitamos configurar tu primera sucursal para el sistema de punto de venta.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-green-600 h-2"></div>
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100">
                <p className="text-sm text-green-700">
                  Una sucursal representa una ubicación física de tu negocio. Puedes crear más sucursales más adelante.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FaStore className="mr-2 text-green-500" />
                    Nombre de la Sucursal *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={sucursal.nombre}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: Sucursal Principal"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FaLocationArrow className="mr-2 text-green-500" />
                    Dirección *
                  </label>
                  <textarea
                    name="direccion"
                    value={sucursal.direccion}
                    onChange={handleChange}
                    rows="2"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: Calle Principal #123, Ciudad"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <FaPhone className="mr-2 text-green-500" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={sucursal.telefono}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Ej: (123) 456-7890"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <FaEnvelope className="mr-2 text-green-500" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={sucursal.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="sucursal@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FaClock className="mr-2 text-green-500" />
                    Horario de Atención
                  </label>
                  <textarea
                    name="horario"
                    value={sucursal.horario}
                    onChange={handleChange}
                    rows="2"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: Lunes a Viernes: 8:00 AM - 6:00 PM"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
                      Creando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continuar al Dashboard
                      <FaArrowRight className="ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstBranchSetup;