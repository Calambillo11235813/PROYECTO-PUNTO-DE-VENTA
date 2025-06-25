import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Store } from 'lucide-react';
import { toast } from 'react-toastify';

const MovimientoModal = ({ 
  setShowMovimientoModal, 
  movimientoData, 
  setMovimientoData,
  isLoading,
  setIsLoading,
  cajaActual,
  movimientoService,
  checkCajaStatus,
  sucursalActual // Nuevo prop para sucursal
}) => {
  const movimientoInputRef = useRef(null);
  const textareaRef = useRef(null);
  // Estado local separado para la descripción
  const [descripcion, setDescripcion] = useState("");
  
  // Al abrir el modal, sincronizamos el estado local con el movimientoData
  useEffect(() => {
    setDescripcion(movimientoData.descripcion);
    
    if (movimientoInputRef.current) {
      movimientoInputRef.current.focus();
    }
    
    // Log para depuración
    console.log('🏪 MovimientoModal para sucursal:', sucursalActual);
    console.log('💰 Datos de caja para movimientos:', cajaActual);
  }, [movimientoData.descripcion, cajaActual, sucursalActual]);
  
  // Handle monto changes sin validación previa
  const handleMontoChange = (e) => {
    const value = e.target.value;
    setMovimientoData(prevState => ({...prevState, monto: value}));
  };
  
  // Manejador separado para la descripción que actualiza solo el estado local
  const handleDescripcionChange = (e) => {
    setDescripcion(e.target.value);
  };
  
  const handleMovimientoSubmit = async () => {
    // Transferir la descripción del estado local al estado principal para envío
    const dataToSubmit = {
      ...movimientoData,
      descripcion: descripcion
    };
    
    // Validación solo al momento de registrar
    if (!dataToSubmit.monto.trim()) {
      toast.error("Por favor ingrese un monto");
      movimientoInputRef.current?.focus();
      return;
    }
    
    // Convertir string a número para validación
    const montoNumerico = parseFloat(dataToSubmit.monto.replace(/,/g, '.').trim());
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("Por favor ingrese un monto válido mayor a cero");
      movimientoInputRef.current?.focus();
      return;
    }

    if (!descripcion.trim()) {
      toast.error("Por favor ingrese una descripción");
      textareaRef.current?.focus();
      return;
    }

    // Verificar que tenemos una caja para la sucursal actual
    if (!cajaActual || !cajaActual.id) {
      toast.error(`No hay una caja abierta para registrar movimientos en ${sucursalActual?.nombre || 'esta sucursal'}`);
      return;
    }
    
    // Verificar que la caja pertenece a la sucursal actual
    if (cajaActual.sucursal && sucursalActual?.id && 
        parseInt(cajaActual.sucursal) !== parseInt(sucursalActual.id)) {
      toast.error(`La caja pertenece a otra sucursal. No puede registrar movimientos desde ${sucursalActual?.nombre}`);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log(`📝 Registrando ${dataToSubmit.tipo} de $${montoNumerico} en caja ${cajaActual.id} (Sucursal: ${sucursalActual?.nombre || 'N/A'})`);

      await movimientoService.registrarMovimiento(cajaActual.id, {
        tipo: dataToSubmit.tipo,
        monto: montoNumerico,
        descripcion: descripcion.trim(),
        // Incluir sucursal_id para validación adicional
        sucursal_id: sucursalActual?.id
      });
      
      toast.success(`${dataToSubmit.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'} registrado correctamente en ${sucursalActual?.nombre || 'la sucursal actual'}`);
      
      // Cerrar modal y resetear formulario
      setShowMovimientoModal(false);
      setMovimientoData({
        tipo: "ingreso",
        monto: "",
        descripcion: ""
      });
      setDescripcion("");
      
      // Actualizar lista de movimientos y datos de caja
      await checkCajaStatus();
    } catch (error) {
      console.error("❌ Error al registrar movimiento:", error);
      toast.error("Error al registrar el movimiento: " + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className=" rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {movimientoData.tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Retiro'}
            {sucursalActual?.id && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                <Store className="h-3 w-3 mr-1" /> {sucursalActual.nombre}
              </span>
            )}
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
              ref={movimientoInputRef}
              type="text"
              value={movimientoData.monto}
              onChange={handleMontoChange}
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
            ref={textareaRef}
            value={descripcion} // Usar el estado local separado
            onChange={handleDescripcionChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Motivo del movimiento"
            rows="3"
          ></textarea>
        </div>
        
        {/* Mostrar información de la sucursal */}
        <div className="mb-4 bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Store className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Sucursal: <strong>{sucursalActual?.nombre || 'No seleccionada'}</strong>
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            El movimiento se registrará en la caja actual de esta sucursal.
          </div>
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
            disabled={isLoading || !sucursalActual?.id}
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
        
        {!sucursalActual?.id && (
          <div className="mt-3 text-sm text-red-500">
            No puede registrar movimientos sin seleccionar una sucursal.
          </div>
        )}
      </div>
    </div>
  );
};

export default MovimientoModal;