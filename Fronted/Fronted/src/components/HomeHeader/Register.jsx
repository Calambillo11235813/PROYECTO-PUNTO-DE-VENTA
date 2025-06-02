import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard as CreditCardIcon } from 'lucide-react'; // Añadir esta importación
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
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [timeoutError, setTimeoutError] = useState(false); // Nuevo estado para el error de timeout
  const [renderKey, setRenderKey] = useState(0); // Estado para forzar re-renderizado
  const [stripeKey, setStripeKey] = useState(0); // Nueva clave para Stripe
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Debug del plan recibido
  useEffect(() => {
    if (plan) {
      console.log('📋 Plan recibido en RegisterWithPlan:', plan);
      console.log('   - ID:', plan.id);
      console.log('   - Nombre:', plan.nombre);
      console.log('   - Precio:', plan.precio);
    } else {
      console.warn('⚠️ No se recibió plan en RegisterWithPlan');
    }
  }, [plan]);

  // Función de retry con exponential backoff
  const getClientSecretWithRetry = async () => {
    if (step !== 3 || !plan?.precio) return;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        setLoading(true);
        setPaymentError(null);
        
        if (attempt > 0) {
          console.log(`🔄 Reintentando crear PaymentIntent (intento ${attempt + 1}/${MAX_RETRIES + 1})`);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }

        const response = await paymentService.createPaymentIntent(
          parseFloat(plan.precio),
          'usd',
          `Suscripción Plan ${plan.nombre}`,
          true
        );
        
        setClientSecret(response.client_secret);
        setRetryCount(0);
        return; // Éxito, salir del loop
        
      } catch (error) {
        console.error(`❌ Error en intento ${attempt + 1}:`, error);
        
        if (attempt === MAX_RETRIES) {
          // Último intento fallido, mostrar error final
          setPaymentError(
            `Error persistente del servidor después de ${MAX_RETRIES + 1} intentos. ` +
            'Por favor, contacte al soporte técnico.'
          );
          setRetryCount(attempt + 1);
        }
      } finally {
        if (attempt === MAX_RETRIES) {
          setLoading(false);
        }
      }
    }
  };

  // Obtener el clientSecret cuando entramos al paso 3
  useEffect(() => {
    const getClientSecret = async () => {
      if (step === 3 && plan?.precio) {
        try {
          setLoading(true);
          setPaymentError(null); // Limpiar errores previos
          
          console.log('🔄 Creando PaymentIntent para plan:', {
            planId: plan.id,
            precio: plan.precio,
            nombre: plan.nombre
          });

          const response = await paymentService.createPaymentIntent(
            parseFloat(plan.precio),
            'usd',
            `Suscripción Plan ${plan.nombre}`,
            true // isRegistration = true
          );
          
          console.log('✅ PaymentIntent creado exitosamente:', response);
          setClientSecret(response.client_secret);
          
        } catch (error) {
          console.error('❌ Error detallado al crear PaymentIntent:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
          });
          
          // Manejo específico por tipo de error
          if (error.response?.status === 500) {
            setPaymentError(
              'Error interno del servidor. Por favor, contacte al soporte técnico o intente más tarde.'
            );
          } else if (error.response?.status === 400) {
            setPaymentError(
              'Datos de pago inválidos. Por favor, verifique la información del plan.'
            );
          } else if (error.response?.status === 403) {
            setPaymentError(
              'No autorizado para crear el pago. Por favor, inicie sesión nuevamente.'
            );
          } else {
            setPaymentError(
              error.message || 'Error al preparar el pago. Por favor, intente nuevamente.'
            );
          }
          
          toast.error('Error al configurar el pago. Por favor, intente nuevamente.');
        } finally {
          setLoading(false);
        }
      }
    };

    getClientSecret();
  }, [step, plan]);

  // Proceso completo de registro y suscripción con Stripe real
  const handlePaymentSuccess = async (paymentIntent, confirmResult) => {
    try {
      setLoading(true);
      console.log('🎉 Pago exitoso, iniciando proceso de registro completo...');
      console.log('PaymentIntent:', paymentIntent);
      console.log('Plan seleccionado:', plan);

      // 1. Registrar usuario primero
      console.log('📝 Paso 1: Registrando usuario...');
      const registerResponse = await authService.register({
        nombre: userData.nombre,
        correo: userData.correo,
        password: userData.contrasena,
        nombre_empresa: userData.nombre_empresa,
        direccion: userData.direccion,
        nit_empresa: userData.nit_empresa,
      });
      console.log('✅ Usuario registrado:', registerResponse);

      // 2. Login automático para obtener tokens
      console.log('🔑 Paso 2: Realizando login automático...');
      const loginResponse = await authService.login(userData.correo, userData.contrasena);
      console.log('✅ Login exitoso:', loginResponse);
      
      // 3. Guardar tokens en localStorage
      localStorage.setItem('access_token', loginResponse.access);
      localStorage.setItem('refresh_token', loginResponse.refresh);
      localStorage.setItem('id', loginResponse.usuario.id);

      // 4. Crear suscripción con el plan seleccionado
      console.log('📋 Paso 3: Creando suscripción...');
      
      // Calcular fechas
      const fechaInicio = new Date();
      const fechaExpiracion = new Date();
      fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1); // 1 año de duración

      const suscripcionData = {
        plan: plan.id, // ✅ ID del plan seleccionado
        fecha_inicio: fechaInicio.toISOString(),
        fecha_expiracion: fechaExpiracion.toISOString(),
        metodo_pago: 'tarjeta',
        monto_pagado: parseFloat(plan.precio),
        referencia_pago: paymentIntent.id // ID real de Stripe
      };

      console.log('📋 Datos de suscripción a crear:', suscripcionData);

      const suscripcionResponse = await planService.createSubscription(suscripcionData);
      console.log('✅ Suscripción creada exitosamente:', suscripcionResponse);

      // 5. Actualizar contexto de autenticación
      const userDataForContext = {
        id: loginResponse.usuario.id,
        nombre: loginResponse.usuario.nombre,
        correo: loginResponse.usuario.correo,
        rol: loginResponse.usuario.rol || { id: 1, nombre: "admin" },
        is_staff: loginResponse.usuario.is_staff,
        plan: plan.nombre, // ✅ Agregar plan al contexto
        suscripcion: suscripcionResponse // ✅ Agregar datos de suscripción
      };
      
      login(userDataForContext);

      // 6. Mostrar éxito y redirigir
      toast.success(`¡Registro completado! Bienvenido al plan ${plan.nombre.toUpperCase()}`);
      
      // Pequeña pausa para que el usuario vea el mensaje
      setTimeout(() => {
        onClose();
        navigate('/admin');
      }, 2000);

    } catch (error) {
      console.error('❌ Error en registro completo:', error);
      
      // Manejo específico de errores
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Datos inválidos para crear la suscripción';
        toast.error(`Error al crear suscripción: ${errorMessage}`);
      } else if (error.response?.status === 409) {
        toast.error('El usuario ya tiene una suscripción activa');
      } else {
        toast.error(error.message || 'Error en el proceso de registro');
      }
      
      // En caso de error, al menos el usuario fue creado, redirigir con mensaje
      if (localStorage.getItem('access_token')) {
        toast.info('Usuario creado correctamente. Por favor, contacta soporte para activar tu plan.');
        setTimeout(() => {
          onClose();
          navigate('/admin');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mejorar el manejo de errores en handlePaymentError
  const handlePaymentError = (error) => {
    console.log("Payment error:", error);
    
    // Manejo específico para error de estado inesperado
    if (error.code === 'payment_intent_unexpected_state') {
      console.log('⚠️ Estado inesperado del PaymentIntent, regenerando...');
      
      // Mostrar mensaje específico
      setPaymentError(
        "El estado del pago es inconsistente. Estamos regenerando el formulario de pago, por favor espere..."
      );
      
      // Esperar un poco y regenerar el clientSecret
      setTimeout(() => {
        getClientSecret();
      }, 2000);
      
      return;
    }
    
    // Para otros errores
    setPaymentError(error.message || 'Error al procesar el pago');
  };

  // Navegación entre pasos
  const nextStep = () => {
    // Validación específica para cada paso
    if (step === 1) {
      // Validar datos personales
      if (!userData.nombre || !userData.correo || !userData.contrasena || !userData.confirmContrasena) {
        toast.error('Por favor, completa todos los campos obligatorios');
        return;
      }
      
      if (userData.contrasena !== userData.confirmContrasena) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      
      if (userData.contrasena.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }
    
    if (step === 2) {
      // Validar datos de empresa
      if (!userData.nombre_empresa || !userData.direccion || !userData.nit_empresa) {
        toast.error('Por favor, completa todos los campos de la empresa');
        return;
      }
    }
    
    console.log(`✅ Paso ${step} validado correctamente, avanzando al paso ${step + 1}`);
    console.log('📋 Plan seleccionado:', plan);
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Añadir un efecto separado para manejar la visualización del formulario
  useEffect(() => {
    // Este efecto se ejecuta cuando clientSecret cambia
    if (clientSecret) {
      console.log('🔄 clientSecret actualizado, forzando renderizado del formulario');
      // Asegurar que loading está en false
      setLoading(false);
      // Opcional: forzar un re-renderizado si es necesario
      setRenderKey(Date.now());
    }
  }, [clientSecret]);

  // Cuando recibimos el clientSecret, actualizamos la key para forzar un re-renderizado
  useEffect(() => {
    if (clientSecret) {
      setStripeKey(prev => prev + 1);
    }
  }, [clientSecret]);

  // En RegisterWithPlan, añadir este useEffect:
  useEffect(() => {
    // Regenerar el clientSecret si lleva mucho tiempo activo (prevenir expiración)
    let timeoutId;
    
    if (clientSecret && step === 3) {
      // Regenerar después de 45 minutos para evitar que expire (Stripe expira en 1h)
      timeoutId = setTimeout(() => {
        console.log('⚠️ Regenerando clientSecret para evitar expiración...');
        getClientSecret();
      }, 45 * 60 * 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clientSecret, step]);

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

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Error en el procesamiento del pago
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {paymentError}
                      </div>
                      {retryCount > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={handleRetryPayment}
                            className="bg-red-100 hover:bg-red-200 text-red-800 text-sm px-3 py-1 rounded-md transition-colors"
                          >
                            Intentar nuevamente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando opciones de pago...</p>
                </div>
              ) : clientSecret ? (
                <StripeProvider clientSecret={clientSecret}>
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isRegistration={true}
                  />
                </StripeProvider>
              ) : null}
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
              // Esto conectará el botón con el formulario de Stripe
              type="submit"
              form="payment-form"
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