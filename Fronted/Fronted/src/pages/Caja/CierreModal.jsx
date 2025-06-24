import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, LogOut, Store } from 'lucide-react';
import { toast } from 'react-toastify';
import { cajaService } from '../../services/cajaService';

const CierreModal = ({ 
  setShowCierreModal, 
  cajaActual, 
  movimientos, 
  isLoading,
  handleCerrarCaja,
  onCajaCerrada,
  sucursalActual // Nuevo prop para sucursal
}) => {
  const [conteoEfectivo, setConteoEfectivo] = useState("");
  const [errorConteo, setErrorConteo] = useState(false);
  const conteoInputRef = useRef(null);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [transaccionesEfectivo, setTransaccionesEfectivo] = useState({ total: 0, cantidad_transacciones: 0 });
  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);
  
  // Log para depuración
  console.log('🏪 CierreModal para sucursal:', sucursalActual);
  console.log('💰 Datos de caja para cierre:', cajaActual);
  
  // Obtener transacciones en efectivo cuando se abre el modal
  useEffect(() => {
    if (cajaActual?.id) {
      const obtenerTransacciones = async () => {
        setCargandoTransacciones(true);
        try {
          console.log(`🔍 Obteniendo transacciones en efectivo para caja ${cajaActual.id} en sucursal ${sucursalActual?.id}`);
          const data = await cajaService.getTransaccionesEfectivo(cajaActual.id);
          console.log('✅ Transacciones obtenidas:', data);
          setTransaccionesEfectivo(data);
        } catch (error) {
          console.error("❌ Error al obtener transacciones en efectivo:", error);
          setTransaccionesEfectivo({ total: 0, cantidad_transacciones: 0 });
          toast.error("No se pudieron cargar las transacciones en efectivo");
        } finally {
          setCargandoTransacciones(false);
        }
      };
      
      obtenerTransacciones();
    }
  }, [cajaActual, sucursalActual]);
  
  // Darle foco al input cuando se abre el modal
  useEffect(() => {
    if (conteoInputRef.current) {
      conteoInputRef.current.focus();
    }
  }, []);
  
  // Calcular el monto final en efectivo (monto inicial + movimientos + ventas en efectivo)
  const montoFinalEfectivo = cajaActual ? 
    parseFloat(cajaActual.monto_inicial || 0) + 
    movimientos.reduce((total, mov) => {
      if (mov.tipo === 'ingreso') return total + parseFloat(mov.monto || 0);
      if (mov.tipo === 'retiro') return total - parseFloat(mov.monto || 0);
      return total;
    }, 0) +
    parseFloat(transaccionesEfectivo.total || 0) : 0;
  
  // Validar el conteo de efectivo
  const validarConteo = () => {
    if (!conteoEfectivo.trim()) {
      setErrorConteo(true);
      toast.error("Por favor ingrese el conteo manual de efectivo");
      conteoInputRef.current?.focus();
      return false;
    }
    
    const conteoNumerico = parseFloat(conteoEfectivo.replace(/,/g, '.').trim());
    if (isNaN(conteoNumerico)) {
      setErrorConteo(true);
      toast.error("Por favor ingrese un valor numérico válido");
      conteoInputRef.current?.focus();
      return false;
    }
    
    // Verificar si el conteo manual coincide con el monto calculado
    const diferencia = Math.abs(conteoNumerico - montoFinalEfectivo);
    const coincide = diferencia < 0.01; // Permitir una pequeña diferencia por redondeo
    
    setErrorConteo(!coincide);
    if (!coincide) {
      toast.error(`El conteo manual ($${conteoNumerico.toFixed(2)}) no coincide con el monto calculado ($${montoFinalEfectivo.toFixed(2)})`);
      conteoInputRef.current?.focus();
    }
    
    return coincide;
  };
  
  // Función de cierre de caja
  const handleCierreCajaValidado = async () => {
    if (!validarConteo()) {
      return;
    }
    
    try {
      setCierreLoading(true);
      
      // Verificar que la sucursal seleccionada coincida con la de la caja
      if (sucursalActual?.id && cajaActual?.sucursal && 
          parseInt(sucursalActual.id) !== parseInt(cajaActual.sucursal)) {
        console.warn(`⚠️ Intentando cerrar caja de sucursal ${cajaActual.sucursal} desde la sucursal ${sucursalActual.id}`);
        toast.warning(`La caja pertenece a otra sucursal. Asegúrese de estar en la sucursal correcta.`);
      }
      
      console.log(`🔒 Cerrando caja ${cajaActual.id} en sucursal ${sucursalActual?.id}`);
      
      // Enviar el conteo manual al backend
      const result = await cajaService.cerrarCaja({
        conteo_manual: parseFloat(conteoEfectivo)
      });
      
      console.log('✅ Caja cerrada exitosamente:', result);
      toast.success(`¡Caja cerrada exitosamente en ${sucursalActual?.nombre || 'esta sucursal'}!`);
      setShowCierreModal(false);
      
      // Mostrar resumen del cierre
      const resumen = `
        Sucursal: ${sucursalActual?.nombre || 'N/A'}
        Total en efectivo: $${result.total_efectivo}
        Total en tarjeta: $${result.total_tarjeta}
        Total en QR/transferencia: $${result.total_qr}
        Monto final: $${result.monto_final}
      `;
      toast.info(resumen);
      
      // Notificar que la caja se ha cerrado para actualizar la UI
      onCajaCerrada();
    } catch (error) {
      console.error("❌ Error al cerrar caja:", error);
      toast.error(error.response?.data?.error || "Error al cerrar la caja");
    } finally {
      setCierreLoading(false);
    }
  };
  
  // Handler para actualizar el valor del conteo
  const handleConteoChange = (e) => {
    const value = e.target.value;
    const regex = /^\d*\.?\d*$/;
    
    // Solo actualizar si el formato es válido
    if (value === '' || regex.test(value)) {
      setConteoEfectivo(value);
      setErrorConteo(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className=" rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-1 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Cierre de Caja</h2>
          <button 
            onClick={() => setShowCierreModal(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
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
                  El sistema calculará automáticamente los montos finales basados en los movimientos de efectivo registrados.
                </p>
              </div>
            </div>
          </div>
          
          <CierreCajaResumen
            cajaActual={cajaActual}
            movimientos={movimientos}
            transaccionesEfectivo={transaccionesEfectivo}
            cargandoTransacciones={cargandoTransacciones}
            montoFinalEfectivo={montoFinalEfectivo}
          />
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Conteo manual de efectivo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={conteoInputRef}
                type="text"
                value={conteoEfectivo}
                onChange={handleConteoChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errorConteo ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                placeholder="0.00"
              />
            </div>
            {errorConteo && (
              <p className="mt-1 text-sm text-red-600">
                El conteo manual debe coincidir con el monto calculado por el sistema
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              * Debe coincidir con el monto final en efectivo calculado por el sistema
            </p>
          </div>
        </div>
        
        <p className="mb-6 text-red-600 font-medium">
          ¿Estás seguro de que deseas cerrar la caja? Esta acción no se puede deshacer.
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowCierreModal(false)}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={cierreLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleCierreCajaValidado}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            disabled={cierreLoading}
          >
            {cierreLoading ? (
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
};

// Componente interno para el resumen de cierre de caja
const CierreCajaResumen = ({ cajaActual, movimientos, transaccionesEfectivo, cargandoTransacciones, montoFinalEfectivo }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="font-medium text-gray-700 mb-2">Resumen de la caja actual:</h3>
      <p><strong>Fecha de apertura:</strong> {cajaActual?.fecha_apertura ? new Date(cajaActual.fecha_apertura).toLocaleString() : 'No disponible'}</p>
      <p><strong>Monto inicial:</strong> ${parseFloat(cajaActual?.monto_inicial || 0).toFixed(2)}</p>
      <p><strong>Cantidad de movimientos:</strong> {movimientos?.length || 0}</p>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 mb-2">Cálculo del monto final de efectivo:</h4>
        
        <div className="bg-white p-3 rounded-md mb-2">
          <p className="text-sm flex justify-between">
            <span><strong>Monto inicial:</strong></span> 
            <span className="font-mono">${parseFloat(cajaActual?.monto_inicial || 0).toFixed(2)}</span>
          </p>
          
          <p className="text-sm flex justify-between">
            <span><strong>Movimientos de caja:</strong></span>
            <span className={`font-mono ${
              movimientos.reduce((total, mov) => {
                if (mov.tipo === 'ingreso') return total + parseFloat(mov.monto || 0);
                if (mov.tipo === 'retiro') return total - parseFloat(mov.monto || 0);
                return total;
              }, 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${movimientos.reduce((total, mov) => {
                if (mov.tipo === 'ingreso') return total + parseFloat(mov.monto || 0);
                if (mov.tipo === 'retiro') return total - parseFloat(mov.monto || 0);
                return total;
              }, 0).toFixed(2)}
            </span>
          </p>
          
          {cargandoTransacciones ? (
            <p className="text-sm flex justify-between">
              <span><strong>Ventas en efectivo:</strong></span>
              <span className="font-mono text-gray-400">Cargando...</span>
            </p>
          ) : (
            <p className="text-sm flex justify-between">
              <span>
                <strong>Ventas en efectivo:</strong> 
                <span className="ml-1 text-xs text-gray-500">
                  ({transaccionesEfectivo.cantidad_transacciones} {transaccionesEfectivo.cantidad_transacciones === 1 ? 'transacción' : 'transacciones'})
                </span>
              </span>
              <span className="font-mono text-green-600">
                ${parseFloat(transaccionesEfectivo.total || 0).toFixed(2)}
              </span>
            </p>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="font-bold flex justify-between">
              <span><strong>Monto final en efectivo (sistema):</strong></span>
              <span className="font-mono text-green-600">${montoFinalEfectivo.toFixed(2)}</span>
            </p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          Nota: Este es el monto que debe haber en la caja según el sistema. El conteo manual debe coincidir con este valor.
        </p>
      </div>
    </div>
  );
};

export default CierreModal;