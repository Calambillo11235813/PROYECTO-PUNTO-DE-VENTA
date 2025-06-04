import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid';
import authService from '../../services/authService';
import planService from '../../services/planService';
import { useAuth } from '../Contexts/AuthContext';

const RegisterWithPlan = ({ plan, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados del formulario
  const [step, setStep] = useState(1); // 1: Datos personales, 2: Datos de empresa, 3: Pago
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Datos del usuario y empresa
  const [userData, setUserData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    confirmContrasena: '',
    nombre_empresa: '',
    direccion: '',
    nit_empresa: ''
  });

  // Datos de pago
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'tarjeta',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    accountNumber: '',
    bankName: ''
  });

  const [errors, setErrors] = useState({});

  // Métodos de pago disponibles
  const paymentMethods = [
    {
      id: 'tarjeta',
      name: 'Tarjeta de Crédito/Débito',
      icon: <CreditCardIcon className="h-5 w-5" />,
      description: 'Pago seguro con tarjeta'
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria',
      icon: <BuildingLibraryIcon className="h-5 w-5" />,
      description: 'Transferencia directa'
    },
    {
      id: 'efectivo',
      name: 'Pago en Efectivo',
      icon: <BanknotesIcon className="h-5 w-5" />,
      description: 'Pago en oficinas autorizadas'
    }
  ];

  // Validaciones por paso
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!userData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
      if (!userData.correo.trim()) newErrors.correo = 'El correo es requerido';
      if (!userData.correo.includes('@')) newErrors.correo = 'El correo no es válido';
      if (!userData.contrasena) newErrors.contrasena = 'La contraseña es requerida';
      if (userData.contrasena.length < 6) newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      if (userData.contrasena !== userData.confirmContrasena) {
        newErrors.confirmContrasena = 'Las contraseñas no coinciden';
      }
    }

    if (stepNumber === 2) {
      if (!userData.nombre_empresa.trim()) newErrors.nombre_empresa = 'El nombre de empresa es requerido';
      if (!userData.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
      if (!userData.nit_empresa.trim()) newErrors.nit_empresa = 'El NIT es requerido';
    }

    if (stepNumber === 3) {
      if (paymentData.paymentMethod === 'tarjeta') {
        if (!paymentData.cardNumber.trim()) newErrors.cardNumber = 'Número de tarjeta requerido';
        if (!paymentData.expiryDate.trim()) newErrors.expiryDate = 'Fecha de expiración requerida';
        if (!paymentData.cvv.trim()) newErrors.cvv = 'CVV requerido';
        if (!paymentData.holderName.trim()) newErrors.holderName = 'Titular de tarjeta requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en formularios
  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al empezar a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentDataChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Proceso completo de registro y suscripción
  const handleCompleteRegistration = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);

      // 1. Simular procesamiento de pago
      const paymentResult = await planService.processPayment({
        amount: plan.precio,
        method: paymentData.paymentMethod,
        plan_id: plan.id
      });

      if (!paymentResult.success) {
        throw new Error('Error en el procesamiento del pago');
      }

      // 2. Registrar usuario
      const registerResponse = await authService.register({
        nombre: userData.nombre,
        correo: userData.correo,
        password: userData.contrasena,
        nombre_empresa: userData.nombre_empresa,
        direccion: userData.direccion,
        nit_empresa: userData.nit_empresa,
      });

      console.log('Usuario registrado exitosamente:', registerResponse);

      // 3. Login automático
      const loginResponse = await authService.login(userData.correo, userData.contrasena);
      
      // 4. Guardar tokens
      localStorage.setItem('access_token', loginResponse.access);
      localStorage.setItem('refresh_token', loginResponse.refresh);
      localStorage.setItem('id', loginResponse.usuario.id);

      // 5. Crear suscripción
      await planService.createSubscription({
        plan: plan.id,
        fecha_inicio: new Date().toISOString(),
        fecha_expiracion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        metodo_pago: paymentData.paymentMethod,
        monto_pagado: plan.precio,
        referencia_pago: paymentResult.transaction_id
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
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 1 ? <CheckCircleIcon className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos Personales</span>
            </div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step > 2 ? <CheckCircleIcon className="h-5 w-5" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos de Empresa</span>
            </div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Pago</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Paso 1: Datos Personales */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <UserIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
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
                    onChange={handleUserDataChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={userData.correo}
                    onChange={handleUserDataChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.correo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ejemplo@correo.com"
                  />
                  {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="contrasena"
                      value={userData.contrasena}
                      onChange={handleUserDataChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 ${
                        errors.contrasena ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.contrasena && <p className="text-red-500 text-xs mt-1">{errors.contrasena}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmContrasena"
                      value={userData.confirmContrasena}
                      onChange={handleUserDataChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10 ${
                        errors.confirmContrasena ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirma tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmContrasena && <p className="text-red-500 text-xs mt-1">{errors.confirmContrasena}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Datos de Empresa */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BuildingOfficeIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
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
                    onChange={handleUserDataChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.nombre_empresa ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de tu empresa"
                  />
                  {errors.nombre_empresa && <p className="text-red-500 text-xs mt-1">{errors.nombre_empresa}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={userData.direccion}
                    onChange={handleUserDataChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dirección de la empresa"
                  />
                  {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT de la empresa *
                  </label>
                  <input
                    type="text"
                    name="nit_empresa"
                    value={userData.nit_empresa}
                    onChange={handleUserDataChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.nit_empresa ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número de Identificación Tributaria"
                  />
                  {errors.nit_empresa && <p className="text-red-500 text-xs mt-1">{errors.nit_empresa}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información de Pago */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CreditCardIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Información de Pago</h3>
                <p className="text-gray-600">Completa tu suscripción</p>
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
                  <div>
                    <span className="text-gray-600">Productos:</span>
                    <span className="ml-2 font-medium">
                      {plan?.max_productos === 0 ? 'Ilimitados' : plan?.max_productos}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Empleados:</span>
                    <span className="ml-2 font-medium">{plan?.max_empleados}</span>
                  </div>
                </div>
              </div>

              {/* Métodos de pago */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Método de Pago</h4>
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentData.paymentMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentData.paymentMethod === method.id}
                        onChange={handlePaymentDataChange}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`mr-3 ${paymentData.paymentMethod === method.id ? 'text-green-600' : 'text-gray-400'}`}>
                          {method.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                      {paymentData.paymentMethod === method.id && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Campos específicos de tarjeta */}
                {paymentData.paymentMethod === 'tarjeta' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Tarjeta *
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={paymentData.cardNumber}
                          onChange={handlePaymentDataChange}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="1234 5678 9012 3456"
                        />
                        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titular de la Tarjeta *
                        </label>
                        <input
                          type="text"
                          name="holderName"
                          value={paymentData.holderName}
                          onChange={handlePaymentDataChange}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.holderName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Nombre completo"
                        />
                        {errors.holderName && <p className="text-red-500 text-xs mt-1">{errors.holderName}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Expiración *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentData.expiryDate}
                          onChange={handlePaymentDataChange}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="MM/AA"
                        />
                        {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentData.cvv}
                          onChange={handlePaymentDataChange}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.cvv ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123"
                        />
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Información para transferencia */}
                {paymentData.paymentMethod === 'transferencia' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Datos para Transferencia</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Banco:</strong> Banco Nacional de Bolivia</p>
                      <p><strong>Cuenta:</strong> 1234567890</p>
                      <p><strong>Titular:</strong> PuntoVenta SaaS</p>
                      <p><strong>Monto:</strong> Bs. {plan?.precio}</p>
                    </div>
                  </div>
                )}

                {/* Información para efectivo */}
                {paymentData.paymentMethod === 'efectivo' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 mb-2">Pago en Efectivo</h4>
                    <p className="text-sm text-amber-800">
                      Visite cualquiera de nuestras oficinas autorizadas para realizar el pago en efectivo.
                      Su suscripción se activará una vez confirmado el pago.
                    </p>
                  </div>
                )}
              </div>
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
                  Procesando...
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