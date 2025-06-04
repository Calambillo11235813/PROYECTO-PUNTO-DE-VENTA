import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  SparklesIcon, 
  ClockIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import planService from '../services/planService';
import PlanCard from '../components/HomeHeader/Planes/PlanCard';

const PlanManager = () => {
  // Estados
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [userLimits, setUserLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLimits, setShowLimits] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
  };

  const handlePlanUpgrade = async () => {
    try {
      setConfirmLoading(true);
      
      // Procesar el pago
      const paymentResult = await planService.processPayment({
        amount: selectedPlan.precio,
        method: 'tarjeta',
        plan_id: selectedPlan.id
      });

      if (paymentResult.success) {
        // Actualizar suscripción
        await planService.updateSubscription({
          plan: selectedPlan.id,
          fecha_expiracion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          metodo_pago: 'tarjeta',
          monto_pagado: selectedPlan.precio,
          referencia_pago: paymentResult.transaction_id
        });
        
        toast.success(`¡Plan actualizado a ${selectedPlan.nombre}!`);
        setUpgradeModalOpen(false);
        
        // Recargar datos
        await loadPlanData();
      }
    } catch (error) {
      console.error("Error al actualizar plan:", error);
      toast.error("No se pudo actualizar el plan. Inténtelo más tarde.");
    } finally {
      setConfirmLoading(false);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header con información del plan actual */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <SparklesIcon className="h-6 w-6 text-green-500 mr-2" />
          Mi Plan
        </h1>
        <p className="text-gray-600">
          Administra tu suscripción y visualiza tu uso actual
        </p>
      </div>

      {/* Panel de plan actual */}
      {currentPlan ? (
        <div className={`p-6 ${isSubscriptionActive ? 'bg-green-50' : 'bg-red-50'} border-b border-gray-200`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {isSubscriptionActive ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Plan {currentPlan.plan_nombre}
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  {isSubscriptionActive ? (
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-green-600" />
                      {daysUntilExpiry} días restantes
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Plan expirado</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Monto: Bs. {parseFloat(currentPlan.monto_pagado).toFixed(2)} •
                  Renovación: {new Date(currentPlan.fecha_expiracion).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <button 
              className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center"
              onClick={() => setShowLimits(!showLimits)}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {showLimits ? 'Ocultar uso' : 'Ver uso actual'}
            </button>
          </div>

          {/* Panel de límites y uso */}
          {showLimits && userLimits && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userLimits.limites?.productos?.utilizados || 0}
                </div>
                <div className="text-xs text-gray-600">
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
        <div className="p-6 bg-yellow-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Sin plan activo
              </h2>
              <p className="text-sm text-gray-600">
                No tienes ningún plan actualmente. Selecciona un plan para comenzar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Planes disponibles */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentPlan ? 'Cambiar de plan' : 'Planes disponibles'}
          </h2>
          <button 
            onClick={loadPlanData}
            className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center"
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
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Información importante
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <ChevronRightIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              El cambio de plan se aplicará inmediatamente después del pago.
            </span>
          </li>
          <li className="flex items-start">
            <ChevronRightIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Al actualizar a un plan superior, se aplicará un crédito proporcional al tiempo restante de tu plan actual.
            </span>
          </li>
          <li className="flex items-start">
            <ChevronRightIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Si cambias a un plan inferior, los datos que excedan los nuevos límites no se eliminarán, pero no podrás crear nuevos hasta que estés por debajo del límite.
            </span>
          </li>
        </ul>
      </div>

      {/* Modal de confirmación de cambio de plan */}
      {upgradeModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Confirmar cambio de plan
            </h2>
            
            <p className="text-gray-700 mb-4">
              ¿Estás seguro que deseas cambiar tu plan a <span className="font-semibold capitalize">{selectedPlan.nombre}</span>?
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Nuevo plan:</span>
                <span className="font-medium capitalize">{selectedPlan.nombre}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Precio:</span>
                <span className="font-medium">Bs. {parseFloat(selectedPlan.precio).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Duración:</span>
                <span className="font-medium">1 año</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlanUpgrade}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={confirmLoading}
              >
                {confirmLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;