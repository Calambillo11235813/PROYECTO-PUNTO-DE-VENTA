import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TruckIcon,
  PhoneIcon
} from '@heroicons/react/24/solid';
import planService from '../../../services/planService';
import PlanCard from './PlanCard';
import RegisterWithPlan from '../Register';

const Plans = () => {
  // Estados principales
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Estados para secciones adicionales
  const [showComparison, setShowComparison] = useState(false);
  const [userLimits, setUserLimits] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Verificar y limpiar autenticación inválida al cargar
    const checkAndCleanAuthentication = async () => {
      const userId = localStorage.getItem('id');
      const accessToken = localStorage.getItem('access_token');
      
      if (userId || accessToken) {
        try {
          // Intentar verificar token
          const isValid = await planService.verifyAuthentication();
          
          if (!isValid) {
            // Limpiar todo si no es válido
            console.log("Autenticación inválida detectada, limpiando localStorage");
            localStorage.removeItem('token');
            localStorage.removeItem('id');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error) {
          console.error("Error verificando autenticación, limpiando por seguridad");
          localStorage.clear(); // Más agresivo, limpiar todo
        }
      }
    };
    
    checkAndCleanAuthentication();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar planes (con fallback si falla)
      try {
        console.log('🔍 Cargando planes...');
        const planesData = await planService.getAllPlans();
        console.log('✅ Planes cargados:', planesData);
        setPlans(planesData);
      } catch (planesError) {
        console.error('❌ Error cargando planes:', planesError);
        
        // Intentar obtener planes básicos como fallback
        try {
          const basicPlans = await planService.getBasicPlans();
          setPlans(basicPlans);
          toast.info('Mostrando planes básicos. Inicia sesión para ver más opciones.');
        } catch (fallbackError) {
          console.error('❌ Error cargando planes básicos:', fallbackError);
          toast.error('Error al cargar información de planes');
          setPlans([]); // Establecer array vacío como último recurso
        }
      }

      // Solo intentar cargar datos de suscripción si el usuario está autenticado
      const isAuthenticated = planService.isAuthenticated();
      console.log('🔍 Usuario autenticado:', isAuthenticated);
      
      if (isAuthenticated) {
        try {
          console.log('🔍 Cargando datos de suscripción...');
          const subscriptionData = await planService.getUserSubscription();
          if (subscriptionData) {
            setCurrentSubscription(subscriptionData);
            
            // Cargar límites si hay suscripción
            try {
              const limitsData = await planService.getUserLimits();
              setUserLimits(limitsData);
            } catch (limitsError) {
              console.log('⚠️ No se pudieron cargar los límites:', limitsError);
              // No mostrar error al usuario por esto
            }
          }
        } catch (subscriptionError) {
          console.log('ℹ️ No se pudieron cargar datos de suscripción:', subscriptionError);
          // No mostrar error al usuario, es normal si no tiene suscripción
        }
      }
    } catch (error) {
      console.error('❌ Error general al cargar datos:', error);
      toast.error('Error al cargar información. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de plan
  const handleSelectPlan = (plan) => {
    // Verificación completa de autenticación
    const userId = localStorage.getItem('id');
    const accessToken = localStorage.getItem('access_token');
    const isFullyAuthenticated = userId && accessToken;
    
    console.log("Estado de autenticación:", { userId, hasAccessToken: !!accessToken });
    
    if (!isFullyAuthenticated) {
      // Usuario no autenticado - mostrar modal de registro
      console.log("Usuario no autenticado, mostrando modal de registro");
      setSelectedPlan(plan);
      setShowRegisterModal(true);
      return;
    }
    
    // Verificación adicional de suscripción
    if (currentSubscription && currentSubscription.plan === plan.id) {
      toast.info('Ya tienes este plan activo');
      return;
    }

    // Usuario autenticado - actualizar plan
    handleUpdatePlan(plan);
  };

  // Añadir una función específica para el proceso de selección de plan
  const handlePlanSelection = (plan) => {
    // Verificar si el usuario está completamente autenticado
    const isAuthenticated = verifyFullAuthentication();
    
    if (!isAuthenticated) {
      console.log("Iniciando flujo de REGISTRO con plan:", plan.nombre);
      setSelectedPlan(plan);
      setShowRegisterModal(true);
      return;
    }
    
    console.log("Iniciando flujo de ACTUALIZACIÓN a plan:", plan.nombre);
    // Verificar si ya tiene el mismo plan
    if (currentSubscription && currentSubscription.plan === plan.id) {
      toast.info('Ya tienes este plan activo');
      return;
    }
    
    // Confirmar cambio de plan
    if (window.confirm(`¿Estás seguro de que deseas cambiar al plan ${plan.nombre}?`)) {
      handleUpdatePlan(plan);
    }
  };

  // Función de verificación de autenticación completa
  const verifyFullAuthentication = () => {
    const userId = localStorage.getItem('id');
    const accessToken = localStorage.getItem('access_token');
    return !!(userId && accessToken);
  };

  // Manejar actualización de plan para usuarios existentes
  const handleUpdatePlan = async (plan) => {
    try {
      // Verificación de seguridad adicional
      const userId = localStorage.getItem('id');
      const accessToken = localStorage.getItem('access_token');
      
      if (!userId || !accessToken) {
        console.error("Intento de actualizar plan sin autenticación completa");
        toast.error("Necesitas iniciar sesión para actualizar tu plan");
        
        // Redirigir al login o mostrar modal de registro
        setSelectedPlan(plan);
        setShowRegisterModal(true);
        return;
      }
      
      setLoading(true);
      
      // Simular procesamiento de pago
      const paymentResult = await planService.processPayment({
        amount: plan.precio,
        method: 'tarjeta',
        plan_id: plan.id
      });

      if (paymentResult.success) {
        // Actualizar suscripción existente
        await planService.updateSubscription({
          plan: plan.id,
          fecha_expiracion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          metodo_pago: 'tarjeta',
          monto_pagado: plan.precio,
          referencia_pago: paymentResult.transaction_id
        });
        
        toast.success('¡Plan actualizado exitosamente!');
        await loadInitialData();
      }
    } catch (error) {
      console.error('Error al actualizar plan:', error);
      toast.error('Error al actualizar el plan. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Componente de estado de carga
  const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando planes disponibles...</p>
      </div>
    </div>
  );

  // Componente de información de suscripción actual
  const CurrentSubscriptionInfo = () => {
    if (!currentSubscription) return null;

    const isActive = currentSubscription.esta_activa;
    const daysUntilExpiry = Math.ceil(
      (new Date(currentSubscription.fecha_expiracion) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className={`mb-8 p-6 rounded-xl border-2 ${
        isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {isActive ? 'Suscripción Activa' : 'Suscripción Expirada'}
              </h3>
              <p className="text-sm text-gray-600">
                Plan {currentSubscription.plan_nombre} - 
                {isActive ? ` ${daysUntilExpiry} días restantes` : ' Renovar para continuar'}
              </p>
            </div>
          </div>
          
          {userLimits && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <ChartBarIcon className="h-4 w-4" />
              Ver Uso Actual
            </button>
          )}
        </div>

        {/* Información de uso actual */}
        {showComparison && userLimits && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userLimits.limites.productos.utilizados}
              </div>
              <div className="text-xs text-gray-600">
                de {userLimits.limites.productos.maximo === 0 ? '∞' : userLimits.limites.productos.maximo} productos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userLimits.limites.empleados.utilizados}
              </div>
              <div className="text-xs text-gray-600">
                de {userLimits.limites.empleados.maximo} empleados
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userLimits.limites.ventas_mensuales.utilizados}
              </div>
              <div className="text-xs text-gray-600">
                de {userLimits.limites.ventas_mensuales.maximo === 0 ? '∞' : userLimits.limites.ventas_mensuales.maximo} ventas/mes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userLimits.limites.sucursales.utilizadas}
              </div>
              <div className="text-xs text-gray-600">
                de {userLimits.limites.sucursales.maximo} sucursales
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="h-8 w-8 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-900">
              Planes de Suscripción
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan perfecto para tu negocio. Todos los planes incluyen soporte técnico y actualizaciones automáticas.
          </p>
          
          {/* Botón de recargar */}
          <button
            onClick={loadInitialData}
            className="mt-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar información
          </button>
        </div>

        {/* Información de suscripción actual */}
        <CurrentSubscriptionInfo />

        {/* Grid de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isPopular={plan.nombre === 'intermedio'}
              onSelectPlan={handleSelectPlan}
              currentPlan={currentSubscription}
              loading={loading}
            />
          ))}
        </div>

        {/* Sección de características adicionales */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            ¿Por qué elegir nuestros planes?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reportes Detallados</h3>
              <p className="text-gray-600 text-sm">
                Analiza el rendimiento de tu negocio con reportes completos y métricas en tiempo real.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Backup Automático</h3>
              <p className="text-gray-600 text-sm">
                Tus datos están seguros con respaldos automáticos diarios en la nube.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <PhoneIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
              <p className="text-gray-600 text-sm">
                Nuestro equipo está disponible para ayudarte cuando lo necesites.
              </p>
            </div>
          </div>
        </div>

        {/* Garantía y políticas */}
        <div className="text-center bg-gray-50 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Garantía de Satisfacción
          </h3>
          <p className="text-gray-600 mb-4">
            Prueba cualquier plan por 30 días. Si no estás satisfecho, te devolvemos tu dinero.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✓ Sin compromiso</span>
            <span>✓ Cancelación fácil</span>
            <span>✓ Soporte incluido</span>
          </div>
        </div>
      </div>

      {/* Modal de registro con plan */}
      <RegisterWithPlan
        plan={selectedPlan}
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
};

export default Plans;