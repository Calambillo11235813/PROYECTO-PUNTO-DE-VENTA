import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PaymentForm from '../PaymentForm';
import StripeProvider from '../StripeProvider';
import authService from '../../services/authService';
import planService from '../../services/planService';
import paymentService from '../../services/paymentService';
import { useAuth } from '../Contexts/AuthContext';

const RegisterWithPlan = ({ plan, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados del formulario
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    confirmContrasena: '',
    nombre_empresa: '',
    direccion: '',
    nit_empresa: ''
  });

  // Proceso completo de registro y suscripción con Stripe real
  const handlePaymentSuccess = async (paymentIntent, confirmResult) => {
    try {
      setLoading(true);

      // 2. Registrar usuario
      const registerResponse = await authService.register({
        nombre: userData.nombre,
        correo: userData.correo,
        password: userData.contrasena,
        nombre_empresa: userData.nombre_empresa,
        direccion: userData.direccion,
        nit_empresa: userData.nit_empresa,
      });

      // 3. Login automático
      const loginResponse = await authService.login(userData.correo, userData.contrasena);
      
      // 4. Guardar tokens
      localStorage.setItem('access_token', loginResponse.access);
      localStorage.setItem('refresh_token', loginResponse.refresh);
      localStorage.setItem('id', loginResponse.usuario.id);

      // 5. Crear suscripción con referencia al pago real
      await planService.createSubscription({
        plan: plan.id,
        fecha_inicio: new Date().toISOString(),
        fecha_expiracion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        metodo_pago: 'tarjeta',
        monto_pagado: plan.precio,
        referencia_pago: paymentIntent.id // ID real de Stripe
      });

      // 6. Actualizar contexto de autenticación
      const userDataForContext = {
        id: loginResponse.usuario.id,
        nombre: loginResponse.usuario.nombre,
        correo: loginResponse.usuario.correo,
        rol: loginResponse.usuario.rol || { id: 1, nombre: "admin" },
        is_staff: loginResponse.usuario.is_staff
      };
      
      login(userDataForContext);

      // 7. Mostrar éxito y redirigir
      toast.success('¡Registro y suscripción completados exitosamente!');
      onClose();
      navigate('/admin');

    } catch (error) {
      console.error('Error en registro completo:', error);
      toast.error(error.message || 'Error en el proceso de registro');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Error en el pago: ' + error.message);
  };

  // Navegación entre pasos
  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Crear Cuenta y Suscribirse
            </h2>
            <p className="text-gray-600 mt-1">
              Plan {plan?.nombre} - Bs. {plan?.precio}/año
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos Personales</span>
            </div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos de Empresa</span>
            </div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Pago con Tarjeta</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Paso 1: Datos Personales */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v8m0-8L3 9m9 5l9 5-9 5-9-5 9-5z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Datos Personales</h3>
                <p className="text-gray-600">Información básica de tu cuenta</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={userData.nombre}
                    onChange={e => setUserData({ ...userData, nombre: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={userData.correo}
                    onChange={e => setUserData({ ...userData, correo: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="contrasena"
                    value={userData.contrasena}
                    onChange={e => setUserData({ ...userData, contrasena: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirmContrasena"
                    value={userData.confirmContrasena}
                    onChange={e => setUserData({ ...userData, confirmContrasena: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirma tu contraseña"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Datos de Empresa */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M3 7l9 4 9-4M3 17l9 4 9-4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h3>
                <p className="text-gray-600">Información de tu negocio</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    name="nombre_empresa"
                    value={userData.nombre_empresa}
                    onChange={e => setUserData({ ...userData, nombre_empresa: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={userData.direccion}
                    onChange={e => setUserData({ ...userData, direccion: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Dirección de la empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT de la empresa *
                  </label>
                  <input
                    type="text"
                    name="nit_empresa"
                    value={userData.nit_empresa}
                    onChange={e => setUserData({ ...userData, nit_empresa: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Número de Identificación Tributaria"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información de Pago con Tarjeta */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CreditCardIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Completar Pago</h3>
                <p className="text-gray-600">Pago seguro con Stripe</p>
              </div>

              {/* Resumen del plan */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen del Plan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plan:</span>
                    <span className="ml-2 font-medium capitalize">{plan?.nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio:</span>
                    <span className="ml-2 font-medium">Bs. {plan?.precio}/año</span>
                  </div>
                </div>
              </div>

              {/* Integración real de Stripe */}
              <StripeProvider>
                <PaymentForm
                  amount={parseFloat(plan?.precio || 0)}
                  currency="usd"
                  description={`Suscripción Plan ${plan?.nombre}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </StripeProvider>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleCompleteRegistration}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando Pago...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4" />
                  Completar Registro y Pago
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterWithPlan;