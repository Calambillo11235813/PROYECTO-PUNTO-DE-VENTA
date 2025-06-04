import React from 'react';
import { 
  CheckIcon, 
  StarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/solid';

const PlanCard = ({ plan, isPopular, onSelectPlan, currentPlan, loading }) => {
  const isCurrentPlan = currentPlan?.plan === plan.id;

  // Iconos para diferentes características
  const getFeatureIcon = (feature) => {
    const iconMap = {
      'productos': <CubeIcon className="h-4 w-4" />,
      'empleados': <UsersIcon className="h-4 w-4" />,
      'ventas': <ChartBarIcon className="h-4 w-4" />,
      'sucursales': <BuildingStorefrontIcon className="h-4 w-4" />,
      'reportes': <ChartBarIcon className="h-4 w-4" />,
      'soporte': <ShieldCheckIcon className="h-4 w-4" />
    };
    return iconMap[feature] || <CheckIcon className="h-4 w-4" />;
  };

  // Características principales del plan
  const mainFeatures = [
    {
      key: 'productos',
      label: plan.max_productos === 0 ? 'Productos ilimitados' : `${plan.max_productos} productos`,
      icon: 'productos'
    },
    {
      key: 'empleados',
      label: `${plan.max_empleados} empleados`,
      icon: 'empleados'
    },
    {
      key: 'ventas',
      label: plan.max_ventas_mensuales === 0 ? 'Ventas ilimitadas' : `${plan.max_ventas_mensuales} ventas/mes`,
      icon: 'ventas'
    },
    {
      key: 'sucursales',
      label: `${plan.max_sucursales} sucursal${plan.max_sucursales > 1 ? 'es' : ''}`,
      icon: 'sucursales'
    }
  ];

  // Funcionalidades premium
  const premiumFeatures = [
    { key: 'tiene_inventario_avanzado', label: 'Inventario Avanzado', enabled: plan.tiene_inventario_avanzado },
    { key: 'tiene_reportes_detallados', label: 'Reportes Detallados', enabled: plan.tiene_reportes_detallados },
    { key: 'tiene_multi_sucursal', label: 'Multi-sucursal', enabled: plan.tiene_multi_sucursal },
    { key: 'tiene_backup_automatico', label: 'Backup Automático', enabled: plan.tiene_backup_automatico },
    { key: 'tiene_soporte_prioritario', label: 'Soporte Prioritario', enabled: plan.tiene_soporte_prioritario },
    { key: 'tiene_facturacion_electronica', label: 'Facturación Electrónica', enabled: plan.tiene_facturacion_electronica }
  ];

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      isPopular ? 'border-green-500 ring-2 ring-green-500 ring-opacity-50' : 'border-gray-200 hover:border-green-300'
    } ${isCurrentPlan ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
      
      {/* Badge de plan popular */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <StarIcon className="h-4 w-4" />
            Más Popular
          </div>
        </div>
      )}

      {/* Badge de plan actual */}
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Plan Actual
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header del plan */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 capitalize mb-2">
            {plan.nombre}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {plan.descripcion}
          </p>
          
          {/* Precio */}
          <div className="mb-4">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900">
                Bs. {parseFloat(plan.precio).toFixed(0)}
              </span>
              <span className="text-lg text-gray-500 ml-1">
                /{plan.duracion === 'anual' ? 'año' : 'mes'}
              </span>
            </div>
            
            {plan.duracion === 'anual' && (
              <div className="mt-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Ahorra Bs. {(parseFloat(plan.precio) * 0.20).toFixed(0)} anual
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Características principales */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Límites incluidos:</h4>
          <ul className="space-y-2">
            {mainFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700">
                <div className="text-green-500 mr-3">
                  {getFeatureIcon(feature.icon)}
                </div>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Funcionalidades premium */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Funcionalidades:</h4>
          <ul className="space-y-2">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <div className={`mr-3 ${feature.enabled ? 'text-green-500' : 'text-gray-300'}`}>
                  <CheckIcon className="h-4 w-4" />
                </div>
                <span className={feature.enabled ? 'text-gray-700' : 'text-gray-400'}>
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onSelectPlan(plan)}
          disabled={loading || isCurrentPlan}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isPopular
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : isCurrentPlan ? (
            'Plan Actual'
          ) : (
            <>
              <CreditCardIcon className="h-4 w-4" />
              Seleccionar Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;