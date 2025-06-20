import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  SparklesIcon, 
  ClockIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChartBarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/react/24/solid';

// ✅ IMPORTAR COMPONENTES STRIPE
import StripeProvider from '../components/Stripe/StripeProvider';
import PaymentForm from '../components/Stripe/PaymentForm';

import planService from '../services/planService';
import paymentService from '../services/paymentService';
import PlanCard from '../components/HomeHeader/Planes/PlanCard';
import useTheme from '../hooks/useTheme'; // Importar el hook de tema

const PlanManager = () => {
  // Estados existentes
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [userLimits, setUserLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLimits, setShowLimits] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ✅ NUEVOS ESTADOS PARA PAGO CON STRIPE
  const [paymentStep, setPaymentStep] = useState('confirmation'); // 'confirmation', 'payment'
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Obtener la paleta de colores
  const { palette } = useTheme();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPlanData();
  }, []);

  const loadPlanData = async () => {
    try {
      setLoading(true);
      
      // Cargar suscripción actual
      const subscription = await planService.getUserSubscription();
      if (subscription) {
        setCurrentPlan(subscription);
        
        // Cargar límites de uso
        try {
          const limitsData = await planService.getUserLimits();
          setUserLimits(limitsData);
        } catch (error) {
          console.error("Error al cargar límites:", error);
        }
      }
      
      // Cargar planes disponibles
      const plans = await planService.getAllPlans();
      setAvailablePlans(plans);
      
    } catch (error) {
      console.error("Error al cargar datos del plan:", error);
      toast.error("No se pudo cargar la información de tu plan");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelection = (plan) => {
    // No permitir seleccionar el plan actual
    if (currentPlan && currentPlan.plan === plan.id) {
      toast.info('Este es tu plan actual');
      return;
    }
    
    setSelectedPlan(plan);
    setUpgradeModalOpen(true);
    setPaymentStep('confirmation');
    setClientSecret(null);
    setPaymentError(null);
  };

  // ✅ FUNCIÓN MEJORADA createPaymentIntent
  const createPaymentIntent = async () => {
    if (!selectedPlan?.precio) {
      setPaymentError('Precio del plan no válido');
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError(null);

      console.log('🔄 Creando PaymentIntent para actualización de plan:', {
        planId: selectedPlan.id,
        precio: selectedPlan.precio,
        nombre: selectedPlan.nombre
      });

      const response = await paymentService.createPaymentIntent(
        parseFloat(selectedPlan.precio),
        'usd',
        `Actualización a Plan ${selectedPlan.nombre}`,
        false // No es registro
      );

      console.log('✅ PaymentIntent creado:', response);
      
      // ✅ ESTABLECER CLIENT SECRET Y CAMBIAR PASO ATÓMICAMENTE
      setClientSecret(response.client_secret);
      setPaymentStep('payment');
      
      // ✅ NO CAMBIAR paymentLoading AQUÍ - DEJAR QUE EL PAYMENT FORM LO MANEJE

    } catch (error) {
      console.error('❌ Error al crear PaymentIntent:', error);
      setPaymentError(error.message || 'Error al preparar el pago');
      toast.error('Error al configurar el pago');
      setPaymentLoading(false);
    }
    // ✅ NO CAMBIAR paymentLoading aquí si todo salió bien
  };

  // ✅ MANEJAR PAGO EXITOSO CON STRIPE
  const handlePaymentSuccess = async (paymentIntent, confirmResult) => {
    try {
      setPaymentLoading(true);
      console.log('🎉 Pago exitoso, actualizando suscripción...', paymentIntent);

      // Actualizar suscripción con referencia de pago real
      const fechaExpiracion = new Date();
      fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1);

      await planService.updateSubscription({
        plan: selectedPlan.id,
        fecha_expiracion: fechaExpiracion.toISOString(),
        metodo_pago: 'tarjeta',
        monto_pagado: parseFloat(selectedPlan.precio),
        referencia_pago: paymentIntent.id // ID real de Stripe
      });

      toast.success(`¡Plan actualizado exitosamente a ${selectedPlan.nombre.toUpperCase()}!`);
      
      // Cerrar modal y recargar datos
      setUpgradeModalOpen(false);
      await loadPlanData();

    } catch (error) {
      console.error("❌ Error al actualizar suscripción:", error);
      toast.error("El pago fue exitoso, pero hubo un error al activar el plan. Contacte soporte.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ MANEJAR ERRORES DE PAGO
  const handlePaymentError = (error) => {
    console.error('❌ Error en el pago:', error);
    setPaymentError(error.message || 'Error al procesar el pago');
    toast.error('Error al procesar el pago. Intente nuevamente.');
  };

  // ✅ FUNCIÓN PARA CERRAR MODAL CON LIMPIEZA
  const handleCloseModal = () => {
    setUpgradeModalOpen(false);
    setPaymentStep('confirmation');
    setClientSecret(null);
    setPaymentError(null);
    setSelectedPlan(null);
  };

  // Calcular días restantes hasta la expiración
  const daysUntilExpiry = currentPlan?.fecha_expiracion 
    ? Math.ceil((new Date(currentPlan.fecha_expiracion) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const isSubscriptionActive = currentPlan?.esta_activa === true;
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-color)' }}></div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg shadow-md overflow-hidden"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    >
      {/* Header con información del plan actual */}
      <div 
        className="p-6 border-b border-gray-200"
        style={{ borderColor: 'rgba(128, 128, 128, 0.2)' }}
      >
        <h1 
          className="text-2xl font-bold mb-2 flex items-center"
          style={{ color: 'var(--text-primary)' }}
        >
          <SparklesIcon className="h-6 w-6 mr-2" style={{ color: 'var(--accent-color)' }} />
          Mi Plan
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Administra tu suscripción y visualiza tu uso actual
        </p>
      </div>

      {/* Panel de plan actual */}
      {currentPlan ? (
        <div 
          className={`p-6 border-b border-gray-200`}
          style={{ 
            backgroundColor: isSubscriptionActive ? 'rgba(0, 128, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
            borderColor: 'rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {isSubscriptionActive ? (
                <CheckCircleIcon 
                  className="h-6 w-6 flex-shrink-0 mt-1" 
                  style={{ color: 'var(--accent-color)' }} 
                />
              ) : (
                <ExclamationTriangleIcon 
                  className="h-6 w-6 flex-shrink-0 mt-1" 
                  style={{ color: '#ef4444' }} 
                />
              )}
              
              <div>
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Plan {currentPlan.plan_nombre}
                </h2>
                <p 
                  className="text-sm mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isSubscriptionActive ? (
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" style={{ color: 'var(--accent-color)' }} />
                      {daysUntilExpiry} días restantes
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Plan expirado</span>
                  )}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Monto: Bs. {parseFloat(currentPlan.monto_pagado).toFixed(2)} •
                  Renovación: {new Date(currentPlan.fecha_expiracion).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <button 
              className="text-sm font-medium flex items-center"
              style={{ color: 'var(--accent-color)' }}
              onClick={() => setShowLimits(!showLimits)}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {showLimits ? 'Ocultar uso' : 'Ver uso actual'}
            </button>
          </div>

          {/* Panel de límites y uso */}
          {showLimits && userLimits && (
            <div 
              className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t"
              style={{ borderColor: 'rgba(128, 128, 128, 0.2)' }}
            >
              <div className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {userLimits.limites?.productos?.utilizados || 0}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  de {userLimits.limites?.productos?.maximo === 0 ? '∞' : userLimits.limites?.productos?.maximo || 0} productos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userLimits.limites?.empleados?.utilizados || 0}
                </div>
                <div className="text-xs text-gray-600">
                  de {userLimits.limites?.empleados?.maximo || 0} empleados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userLimits.limites?.ventas_mensuales?.utilizados || 0}
                </div>
                <div className="text-xs text-gray-600">
                  de {userLimits.limites?.ventas_mensuales?.maximo === 0 ? '∞' : userLimits.limites?.ventas_mensuales?.maximo || 0} ventas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userLimits.limites?.sucursales?.utilizados || 0}
                </div>
                <div className="text-xs text-gray-600">
                  de {userLimits.limites?.sucursales?.maximo || 0} sucursales
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="p-6 border-b border-gray-200"
          style={{ 
            backgroundColor: 'rgba(234, 179, 8, 0.05)',
            borderColor: 'rgba(128, 128, 128, 0.2)'
          }}
        >
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon 
              className="h-6 w-6" 
              style={{ color: '#f59e0b' }} 
            />
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Sin plan activo
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                No tienes ningún plan actualmente. Selecciona un plan para comenzar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Planes disponibles */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentPlan ? 'Cambiar de plan' : 'Planes disponibles'}
          </h2>
          <button 
            onClick={loadPlanData}
            className="text-sm font-medium flex items-center"
            style={{ color: 'var(--accent-color)' }}
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Actualizar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map(plan => (
            <div key={plan.id} className="flex">
              <PlanCard 
                plan={plan}
                isPopular={plan.nombre === 'intermedio'}
                onSelectPlan={handlePlanSelection}
                currentPlan={currentPlan}
                loading={loading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div 
        className="p-6 border-t border-gray-200"
        style={{ 
          backgroundColor: 'rgba(128, 128, 128, 0.05)',
          borderColor: 'rgba(128, 128, 128, 0.2)'
        }}
      >
        <h3 
          className="text-lg font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Información importante
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <ChevronRightIcon 
              className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" 
              style={{ color: 'var(--accent-color)' }} 
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              El cambio de plan se aplicará inmediatamente después del pago.
            </span>
          </li>
          <li className="flex items-start">
            <ChevronRightIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Al actualizar a un plan superior, se aplicará un crédito proporcional al tiempo restante de tu plan actual.
            </span>
          </li>
          <li className="flex items-start">
            <ChevronRightIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Si cambias a un plan inferior, los datos que excedan los nuevos límites no se eliminarán, pero no podrás crear nuevos hasta que estés por debajo del límite.
            </span>
          </li>
        </ul>
      </div>

      {/* ✅ MODAL REDISEÑADO CON PAGO POR TARJETA */}
      {upgradeModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            
            {/* ✅ HEADER MEJORADO */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 
                  className="text-2xl font-bold flex items-center"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <CreditCardIcon 
                    className="h-6 w-6 mr-2" 
                    style={{ color: 'var(--accent-color)' }} 
                  />
                  {paymentStep === 'confirmation' ? 'Confirmar cambio de plan' : 'Completar Pago'}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Plan {selectedPlan.nombre} - Bs. {parseFloat(selectedPlan.precio).toFixed(2)}/año
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ✅ INDICADOR DE PROGRESO */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${paymentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    paymentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Confirmar Plan</span>
                </div>
                
                <div className={`flex items-center ${paymentStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    paymentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Pago con Tarjeta</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* ✅ PASO 1: CONFIRMACIÓN DEL PLAN */}
              {paymentStep === 'confirmation' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <SparklesIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      ¿Confirmas el cambio de plan?
                    </h3>
                    <p className="text-gray-600">
                      Estás a punto de cambiar tu plan a <span className="font-semibold capitalize">{selectedPlan.nombre}</span>
                    </p>
                  </div>

                  {/* ✅ RESUMEN DEL PLAN MEJORADO */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      Resumen del Plan
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Plan:</span>
                        <span className="ml-2 font-medium capitalize">{selectedPlan.nombre}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio:</span>
                        <span className="ml-2 font-medium">Bs. {parseFloat(selectedPlan.precio).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Monto USD:</span>
                        <span className="ml-2 font-medium">${parseFloat(selectedPlan.precio).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duración:</span>
                        <span className="ml-2 font-medium">1 año</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ INFORMACIÓN DE PAGO SEGURO */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Pago Seguro con Stripe
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center">
                        <LockClosedIcon className="h-4 w-4 mr-2" />
                        Conexión encriptada SSL
                      </li>
                      <li className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 mr-2" />
                        Acepta Visa, Mastercard, American Express
                      </li>
                      <li className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Procesamiento seguro garantizado
                      </li>
                    </ul>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error al preparar el pago
                          </h3>
                          <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ PASO 2: FORMULARIO DE PAGO SIN HELPER DE PRUEBAS */}
              {paymentStep === 'payment' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CreditCardIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Completar Pago</h3>
                    <p className="text-gray-600">Pago seguro con Stripe</p>
                  </div>

                  {/* ✅ RESUMEN COMPACTO */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Plan {selectedPlan.nombre}:</span>
                      <span className="font-semibold">${parseFloat(selectedPlan.precio).toFixed(2)} USD</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error en el pago
                          </h3>
                          <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ RENDERIZADO CONDICIONAL ULTRA-ESTABLE */}
                  {paymentLoading && paymentStep === 'payment' && !clientSecret ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando formulario de pago...</p>
                    </div>
                  ) : clientSecret && paymentStep === 'payment' ? (
                    <div className="min-h-[200px]">
                      {/* ✅ STRIPE PROVIDER SIN CAMBIOS */}
                      <StripeProvider 
                        clientSecret={clientSecret}
                        onError={handlePaymentError}
                      >
                        <PaymentForm
                          amount={parseFloat(selectedPlan.precio)}
                          currency="usd"
                          description={`Actualización a Plan ${selectedPlan.nombre}`}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          onLoadingChange={setPaymentLoading}
                          isRegistration={false}
                        />
                      </StripeProvider>
                    </div>
                  ) : paymentStep === 'payment' ? (
                    <div className="text-center py-8">
                      <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">Error al cargar las opciones de pago</p>
                      <button
                        onClick={createPaymentIntent}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ✅ FOOTER CON VALIDACIONES MEJORADAS */}
            <div 
              className="flex gap-3 p-6 border-t border-gray-200"
              style={{ borderColor: 'rgba(128, 128, 128, 0.2)' }}
            >
              <button
                onClick={paymentStep === 'confirmation' ? handleCloseModal : () => setPaymentStep('confirmation')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                style={{ 
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(128, 128, 128, 0.3)'
                }}
                disabled={paymentLoading && paymentStep === 'confirmation'}
              >
                {paymentStep === 'confirmation' ? 'Cancelar' : 'Atrás'}
              </button>
              
              {paymentStep === 'confirmation' ? (
                <button
                  onClick={createPaymentIntent}
                  disabled={paymentLoading}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff'
                  }}
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Preparando pago...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-4 w-4" />
                      Proceder al Pago
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  form="payment-form"
                  disabled={!clientSecret || paymentLoading}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    background: `linear-gradient(to right, var(--accent-color), ${adjustColor('--accent-color', -20)})`,
                    color: '#ffffff'
                  }}
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-4 w-4" />
                      Completar Pago Seguro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Función helper para ajustar un color (aclarar/oscurecer)
function adjustColor(cssVar, amount) {
  // Esta función simulada devuelve un color más oscuro para el gradiente
  // En una implementación real, extraería el color y lo ajustaría matemáticamente
  return `color-mix(in srgb, var(${cssVar}) ${100 + amount}%, black)`;
}

export default PlanManager;