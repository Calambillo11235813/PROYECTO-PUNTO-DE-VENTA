import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import userService from '../services/userService';
import { FaUser, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaIdCard, FaLock, FaShieldAlt, FaSave, FaUndo, FaUserCog, FaCheckCircle, FaTimes } from 'react-icons/fa';

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: '',
    nombre_empresa: '',
    direccion: '',
    nit_empresa: '',
  });
  const [originalUserData, setOriginalUserData] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const currentUserData = await userService.getCurrentUserDetails();
        
        setUserData({
          nombre: currentUserData.nombre || '',
          correo: currentUserData.correo || '',
          password: '',
          confirmPassword: '',
          nombre_empresa: currentUserData.nombre_empresa || '',
          direccion: currentUserData.direccion || '',
          nit_empresa: currentUserData.nit_empresa || '',
        });
        
        setOriginalUserData(currentUserData);
        
      } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
        toast.error('No se pudieron cargar los datos del perfil');
        if (error.message === 'No hay usuario autenticado') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userData.password && userData.password !== userData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    
    try {
      setSaving(true);
      
      const currentUser = JSON.parse(localStorage.getItem('user_data'));
      if (!currentUser || !currentUser.id) {
        throw new Error('No se pudo identificar al usuario actual');
      }
      
      const dataToUpdate = { ...userData };
      delete dataToUpdate.confirmPassword;
      
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }
      
      await userService.editUser(currentUser.id, dataToUpdate);
      
      toast.success('Información actualizada correctamente');
      showNotification('¡Perfil actualizado con éxito!', 'success');
      
      setOriginalUserData({
        ...originalUserData,
        ...dataToUpdate,
        password: undefined
      });
      
      setUserData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error('Error al actualizar información:', error);
      toast.error(error.message || 'Error al actualizar información');
      showNotification(error.message || 'Error al actualizar información', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUserData({
      nombre: originalUserData.nombre || '',
      correo: originalUserData.correo || '',
      password: '',
      confirmPassword: '',
      nombre_empresa: originalUserData.nombre_empresa || '',
      direccion: originalUserData.direccion || '',
      nit_empresa: originalUserData.nit_empresa || '',
    });
    toast.info('Cambios descartados');
    showNotification('Cambios descartados', 'info');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg font-medium text-gray-700">Cargando información...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 max-w-md shadow-lg rounded-lg overflow-hidden ${
          notification.type === 'success' ? 'bg-green-50 border-green-500' : 
          notification.type === 'error' ? 'bg-red-50 border-red-500' : 
          'bg-blue-50 border-blue-500'
        } border-l-4 p-4 animate-fade-in-right transition-all duration-300`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              ) : notification.type === 'error' ? (
                <FaTimes className="h-5 w-5 text-red-500" />
              ) : (
                <FaCheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 
                notification.type === 'error' ? 'text-red-800' : 
                'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification({ show: false, message: '', type: '' })}
                  className={`inline-flex rounded-md p-1.5 ${
                    notification.type === 'success' ? 'text-green-500 hover:bg-green-100' : 
                    notification.type === 'error' ? 'text-red-500 hover:bg-red-100' : 
                    'text-blue-500 hover:bg-blue-100'
                  } focus:outline-none`}
                >
                  <span className="sr-only">Cerrar</span>
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold title-icon flex items-center">
          <FaUserCog className="mr-2 icon-accent" />
          Configuración de Cuenta
        </h1>
        <p className="text-gray-600 mt-2">
          Administra tu información personal y configuración del sistema
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div style={{ backgroundColor: "var(--bg-tertiary)" }}className="flex flex-wrap border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ease-in-out focus:outline-none ${
              activeTab === 'perfil'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('perfil')}
          >
            <FaUser className="inline-block mr-2" />
            Información Personal
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ease-in-out focus:outline-none ${
              activeTab === 'empresa'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('empresa')}
          >
            <FaBuilding className="inline-block mr-2" />
            Datos de Empresa
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors duration-200 ease-in-out focus:outline-none ${
              activeTab === 'seguridad'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('seguridad')}
          >
            <FaLock className="inline-block mr-2" />
            Seguridad
          </button>
        </div>

        <form style={{ backgroundColor: "var(--bg-tertiary)" }}onSubmit={handleSubmit} className="p-6">
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-700 text-sm">
                  Esta información se utiliza para identificarte en el sistema y las comunicaciones
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUser className="inline-block mr-2 text-gray-500" />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={userData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                    <FaEnvelope className="inline-block mr-2 text-gray-500" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={userData.correo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'empresa' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-700 text-sm">
                  Esta información aparecerá en facturas y documentos generados por el sistema
                </p>
              </div>
              
              <div>
                <label htmlFor="nombre_empresa" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaBuilding className="inline-block mr-2 text-gray-500" />
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  id="nombre_empresa"
                  name="nombre_empresa"
                  value={userData.nombre_empresa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>
              
              <div>
                <label htmlFor="nit_empresa" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaIdCard className="inline-block mr-2 text-gray-500" />
                  NIT / Identificación Fiscal
                </label>
                <input
                  type="text"
                  id="nit_empresa"
                  name="nit_empresa"
                  value={userData.nit_empresa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>
              
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMapMarkerAlt className="inline-block mr-2 text-gray-500" />
                  Dirección
                </label>
                <textarea
                  id="direccion"
                  name="direccion"
                  rows="3"
                  value={userData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 border-l-4 border-yellow-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaShieldAlt className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Recomendamos usar contraseñas seguras y cambiarlas regularmente para mantener la seguridad de su cuenta.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaLock className="inline-block mr-2 text-gray-500" />
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={userData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Deja en blanco si no deseas cambiar tu contraseña
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaLock className="inline-block mr-2 text-gray-500" />
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={userData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg transition duration-150 ease-in-out ${
                    userData.password && userData.password !== userData.confirmPassword
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  autoComplete="new-password"
                />
                {userData.password && userData.password !== userData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={saving}
            >
              <FaUndo className="mr-2 -ml-1 h-4 w-4" />
              Descartar cambios
            </button>
            <button
              type="submit"
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={saving}
            >
              <FaSave className="mr-2 -ml-1 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuracion;