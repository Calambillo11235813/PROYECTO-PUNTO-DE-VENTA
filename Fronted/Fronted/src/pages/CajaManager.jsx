import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajaService } from '../services/cajaService';
import { empleadoService } from '../services/EmpleadoService';
import { toast } from 'react-toastify';
import { Wallet, X, DollarSign, LogIn, LogOut, Clock, User, CreditCard, Smartphone } from 'lucide-react';

const CajaManager = () => {
  const navigate = useNavigate();
  const [cajaActual, setCajaActual] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [movimientoData, setMovimientoData] = useState({
    tipo: "ingreso",
    monto: "",
    descripcion: ""
  });

  // Cargar datos de la caja actual al iniciar
  useEffect(() => {
    checkCajaStatus();
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoadingEmpleados(true);
      const data = await empleadoService.getAllEmpleados();
      // Filtrar empleados activos si es necesario
      const empleadosActivos = Array.isArray(data) 
        ? data.filter(emp => emp.estado !== false) 
        : [];
      
      setEmpleados(empleadosActivos);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      toast.error("No se pudieron cargar los empleados");
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const checkCajaStatus = async () => {
    setIsLoading(true);
    try {
      const data = await cajaService.getCajaActual();
      setCajaActual(data);
      
      // Si hay una caja abierta, cargamos sus movimientos
      if (data && data.id) {
        const movimientosData = await cajaService.getMovimientosCaja(data.id);
        setMovimientos(movimientosData);
      }
    } catch (error) {
      console.error("Error al verificar estado de caja:", error);
      // Si no hay caja abierta, error 404 es esperado
      if (error.response && error.response.status === 404) {
        setCajaActual(null);
      } else {
        toast.error("Error al verificar el estado de la caja");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!montoInicial || isNaN(Number(montoInicial)) || Number(montoInicial) <= 0) {
      toast.error("Por favor ingrese un monto inicial válido");
      return;
    }

    try {
      setIsLoading(true);
      const cajaData = {
        monto_inicial: Number(montoInicial),
        empleado: empleadoId ? Number(empleadoId) : null
      };
      
      await cajaService.abrirCaja(cajaData);
      toast.success("¡Caja abierta exitosamente!");
      setShowAperturaModal(false);
      
      // Redirigir a la página de ventas (cambiamos la ruta)
      navigate('/admin/ventas');
    } catch (error) {
      console.error("Error al abrir caja:", error);
      toast.error(error.response?.data?.error || "Error al abrir la caja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      setIsLoading(true);
      const result = await cajaService.cerrarCaja();
      toast.success("¡Caja cerrada exitosamente!");
      setShowCierreModal(false);
      setCajaActual(null);
      
      // Mostrar resumen del cierre
      const resumen = `
        Total en efectivo: $${result.total_efectivo}
        Total en tarjeta: $${result.total_tarjeta}
        Total en QR/transferencia: $${result.total_qr}
        Monto final: $${result.monto_final}
      `;
      toast.info(resumen);
    } catch (error) {
      console.error("Error al cerrar caja:", error);
      toast.error(error.response?.data?.error || "Error al cerrar la caja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovimientoSubmit = async () => {
    if (!movimientoData.monto || isNaN(Number(movimientoData.monto)) || Number(movimientoData.monto) <= 0) {
      toast.error("Por favor ingrese un monto válido");
      return;
    }

    if (!movimientoData.descripcion) {
      toast.error("Por favor ingrese una descripción");
      return;
    }

    try {
      setIsLoading(true);
      await cajaService.registrarMovimiento(cajaActual.id, {
        tipo: movimientoData.tipo,
        monto: Number(movimientoData.monto),
        descripcion: movimientoData.descripcion
      });
      
      toast.success(`${movimientoData.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'} registrado correctamente`);
      setShowMovimientoModal(false);
      
      // Resetear form
      setMovimientoData({
        tipo: "ingreso",
        monto: "",
        descripcion: ""
      });
      
      // Actualizar lista de movimientos
      const movimientosData = await cajaService.getMovimientosCaja(cajaActual.id);
      setMovimientos(movimientosData);
      
      // Actualizar datos de la caja
      checkCajaStatus();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      toast.error("Error al registrar el movimiento de efectivo");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal de Apertura de Caja
  const AperturaModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Apertura de Caja</h2>
          <button 
            onClick={() => setShowAperturaModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Monto Inicial (MXN)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Empleado Asignado
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            {loadingEmpleados ? (
              <div className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-500">
                Cargando empleados...
              </div>
            ) : (
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un empleado</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowAperturaModal(false)}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isLoading || loadingEmpleados}
          >
            Cancelar
          </button>
          <button
            onClick={handleAbrirCaja}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            disabled={isLoading || loadingEmpleados}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Procesando...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-1" />
                Abrir Caja
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de Cierre de Caja
  const CierreModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Cierre de Caja</h2>
          <button 
            onClick={() => setShowCierreModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  El sistema calculará automáticamente los montos finales basados en las ventas y movimientos de efectivo registrados.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Resumen de la caja actual:</h3>
            <p><strong>Fecha de apertura:</strong> {cajaActual?.fecha_apertura ? new Date(cajaActual.fecha_apertura).toLocaleString() : 'No disponible'}</p>
            <p><strong>Monto inicial:</strong> ${cajaActual?.monto_inicial}</p>
            <p><strong>Cantidad de movimientos:</strong> {movimientos?.length || 0}</p>
          </div>
        </div>
        
        <p className="mb-6 text-red-600 font-medium">
          ¿Estás seguro de que deseas cerrar la caja? Esta acción no se puede deshacer.
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowCierreModal(false)}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleCerrarCaja}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Procesando...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5 mr-1" />
                Cerrar Caja
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Modal para registrar movimientos de efectivo
  const MovimientoModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {movimientoData.tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Retiro'}
          </h2>
          <button 
            onClick={() => setShowMovimientoModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tipo de Movimiento
          </label>
          <div className="flex">
            <button
              className={`flex-1 py-2 rounded-l-lg flex items-center justify-center ${
                movimientoData.tipo === 'ingreso' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setMovimientoData({...movimientoData, tipo: 'ingreso'})}
            >
              <span className="mr-1">+</span> Ingreso
            </button>
            <button
              className={`flex-1 py-2 rounded-r-lg flex items-center justify-center ${
                movimientoData.tipo === 'retiro' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setMovimientoData({...movimientoData, tipo: 'retiro'})}
            >
              <span className="mr-1">-</span> Retiro
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Monto (MXN)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={movimientoData.monto}
              onChange={(e) => setMovimientoData({...movimientoData, monto: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Descripción / Motivo
          </label>
          <textarea
            value={movimientoData.descripcion}
            onChange={(e) => setMovimientoData({...movimientoData, descripcion: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Motivo del movimiento"
            rows="3"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowMovimientoModal(false)}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleMovimientoSubmit}
            className={`px-4 py-2 text-white rounded-lg flex items-center ${
              movimientoData.tipo === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Procesando...
              </>
            ) : (
              <>
                {movimientoData.tipo === 'ingreso' ? '+' : '-'} Registrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Wallet className="h-8 w-8 mr-2 text-green-600" />
            Administración de Caja
          </h1>
          <p className="text-gray-600 mt-2">
            {cajaActual 
              ? "Gestione la caja actual, registre movimientos de efectivo y realice el cierre cuando termine su turno."
              : "Abra una nueva caja para comenzar a registrar ventas en el sistema."}
          </p>
        </header>

        {isLoading && !showAperturaModal && !showCierreModal ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {cajaActual ? (
              // Estado: Caja abierta
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        Caja #{cajaActual.id} - Abierta
                      </h2>
                      <p className="flex items-center text-gray-600 mb-2">
                        <Clock className="h-4 w-4 mr-1" />
                        Abierta el {new Date(cajaActual.fecha_apertura).toLocaleString()}
                      </p>
                      {cajaActual.empleado && (
                        <p className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          Empleado asignado: {cajaActual.empleado}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Activa
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-blue-900">Monto Inicial</h3>
                      <DollarSign className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-semibold text-blue-700 mt-2">
                      ${Number(cajaActual.monto_inicial).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-amber-900">Movimientos</h3>
                      <CreditCard className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-semibold text-amber-700 mt-2">
                      {movimientos.length} {movimientos.length === 1 ? 'registro' : 'registros'}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-green-900">Balance Actual</h3>
                      <Smartphone className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-semibold text-green-700 mt-2">
                      ${Number(cajaActual.monto_inicial).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Movimientos de Efectivo</h3>
                    <button 
                      onClick={() => setShowMovimientoModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                    >
                      <span className="mr-1">+</span> Nuevo Movimiento
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {movimientos.length > 0 ? (
                      <table className="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {movimientos.map((mov) => (
                            <tr key={mov.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-800">{new Date(mov.fecha).toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {mov.tipo === 'ingreso' ? '+' : '-'} {mov.tipo}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                <span className={`${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                  ${Number(mov.monto).toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800">{mov.descripcion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No hay movimientos registrados
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 border-t bg-gray-50 flex justify-between">
                  <button
                    onClick={() => navigate('/admin/ventas')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    Ir a Punto de Venta
                  </button>
                  
                  <button
                    onClick={() => setShowCierreModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    Cerrar Caja
                  </button>
                </div>
              </div>
            ) : (
              // Estado: No hay caja abierta
              <div className="bg-white shadow-md rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Wallet className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  No hay una caja abierta actualmente
                </h2>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                  Para comenzar a registrar ventas, primero debe abrir una caja ingresando el monto inicial de efectivo disponible.
                </p>
                <button
                  onClick={() => setShowAperturaModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Abrir Nueva Caja
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {showAperturaModal && <AperturaModal />}
      {showCierreModal && <CierreModal />}
      {showMovimientoModal && <MovimientoModal />}
    </div>
  );
};

export default CajaManager;