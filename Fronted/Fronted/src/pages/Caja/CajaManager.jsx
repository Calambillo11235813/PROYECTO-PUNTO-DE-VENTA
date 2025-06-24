import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, LogIn, LogOut, Store } from 'lucide-react';

// Servicios
import { movimientoService } from '../../services/movimientoService';
import { cajaService } from '../../services/cajaService';
import empleadoService from '../../services/EmpleadoService';
import { pedidoService } from '../../services/pedidoService';
import sucursalService from '../../services/SucursalService';

// Componentes
import AperturaModal from './AperturaModal';
import CierreModal from './CierreModal';
import MovimientoModal from './MoviemientoModal';
import CajaAbierta from './CajaAbierta';
import CajaCerrada from './CajaCerrada';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  // Estado para sucursal actual
  const [sucursalActual, setSucursalActual] = useState(null);

  // Cargar datos de la caja actual y la sucursal al iniciar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      await cargarSucursalActual();
      
      // Cargar empleados específicos de la sucursal seleccionada
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      if (sucursalId) {
        await fetchEmpleados(sucursalId);
      } else {
        // Si no hay sucursal, cargar empleados generales
        await fetchEmpleados();
      }
      
      await checkCajaStatus();
    };
    
    cargarDatosIniciales();
    
    // Agregar listeners para eventos de cambio de sucursal
    window.addEventListener('sucursalChanged', handleSucursalChanged);
    window.addEventListener('sucursalCajaVerificada', handleCajaVerificada);
    
    return () => {
      // Limpiar listeners
      window.removeEventListener('sucursalChanged', handleSucursalChanged);
      window.removeEventListener('sucursalCajaVerificada', handleCajaVerificada);
    };
  }, []);
  
  // Manejador para evento de cambio de sucursal
  const handleSucursalChanged = async () => {
    console.log("🔄 Cambio de sucursal detectado en CajaManager, actualizando...");
    await cargarSucursalActual();
    
    // Cargar empleados específicos de la nueva sucursal
    const sucursalId = localStorage.getItem('sucursal_actual_id');
    if (sucursalId) {
      console.log(`🔄 Actualizando empleados para sucursal ${sucursalId}`);
      await fetchEmpleados(sucursalId);
    }
    
    await checkCajaStatus();
  };
  
  // Manejador para evento de verificación de caja
  const handleCajaVerificada = async (event) => {
    console.log("✅ Estado de caja verificado en nueva sucursal:", event.detail);
    // Actualizar estado con los datos de la caja (si existe)
    if (event.detail.cajaAbierta && event.detail.cajaData) {
      setCajaActual(event.detail.cajaData);
      // Cargar movimientos para esta caja
      if (event.detail.cajaData.id) {
        await cargarMovimientos(event.detail.cajaData.id);
      }
    } else {
      // No hay caja abierta en la sucursal
      setCajaActual(null);
      setMovimientos([]);
    }
  };

  // Función para cargar la información de la sucursal actual
  const cargarSucursalActual = async () => {
    try {
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const sucursalNombre = localStorage.getItem('sucursal_actual_nombre');
      
      console.log(`🏪 Cargando datos de sucursal ID: ${sucursalId}, Nombre: ${sucursalNombre}`);
      
      if (!sucursalId) {
        console.warn("⚠️ No hay sucursal seleccionada");
        setSucursalActual(null);
        return;
      }
      
      // Si ya tenemos el nombre en localStorage, podemos usarlo directamente
      if (sucursalNombre) {
        setSucursalActual({
          id: parseInt(sucursalId),
          nombre: sucursalNombre
        });
        console.log(`🏪 Sucursal cargada desde localStorage: ${sucursalNombre} (${sucursalId})`);
        return;
      }
      
      // Si no tenemos el nombre, intentamos obtenerlo del API
      try {
        const sucursal = await sucursalService.getSucursalById(sucursalId);
        setSucursalActual(sucursal);
        console.log(`🏪 Sucursal cargada desde API: ${sucursal.nombre} (${sucursal.id})`);
      } catch (error) {
        console.error("❌ Error al cargar datos de la sucursal:", error);
        // Usar al menos el ID que tenemos
        setSucursalActual({
          id: parseInt(sucursalId),
          nombre: `Sucursal ${sucursalId}`
        });
      }
    } catch (error) {
      console.error("❌ Error al cargar la sucursal actual:", error);
      setSucursalActual(null);
    }
  };

  // Función para cargar movimientos de una caja específica
  const cargarMovimientos = async (cajaId) => {
    try {
      console.log(`🔍 Cargando movimientos para caja ID ${cajaId}...`);
      const movimientosData = await movimientoService.getMovimientosCaja(cajaId);
      console.log(`✅ ${movimientosData.length} movimientos cargados para caja ${cajaId}`);
      setMovimientos(movimientosData);
    } catch (error) {
      console.error("❌ Error al cargar movimientos:", error);
      setMovimientos([]);
    }
  };

  const fetchEmpleados = async (sucursalId = null) => {
    try {
      setLoadingEmpleados(true);
      
      let empleadosList = [];
      const userId = localStorage.getItem('id');
      
      // Si tenemos sucursal, cargar empleados específicos de esa sucursal
      if (sucursalId) {
        console.log(`🔍 Cargando empleados de la sucursal ${sucursalId}...`);
        try {
          empleadosList = await empleadoService.getEmpleadosBySucursal(userId, sucursalId);
          console.log(`✅ ${empleadosList.length} empleados encontrados para la sucursal ${sucursalId}`);
        } catch (error) {
          console.error(`❌ Error al cargar empleados de sucursal ${sucursalId}:`, error);
          empleadosList = [];
        }
      } else {
        // Si no hay sucursal seleccionada, cargar todos los empleados
        empleadosList = await empleadoService.getAllEmpleados();
        console.log(`✅ ${empleadosList.length} empleados cargados (sin filtro de sucursal)`);
      }
      
      // Filtrar empleados activos Y con rol "Cajero" (rol=2)
      const empleadosCajeros = Array.isArray(empleadosList) 
        ? empleadosList.filter(emp => emp.estado !== false && emp.rol === 2) 
        : [];
      
      console.log(`👤 ${empleadosCajeros.length} empleados cajeros disponibles`);
      setEmpleados(empleadosCajeros);
      
      return empleadosCajeros;
    } catch (error) {
      console.error("❌ Error general al cargar empleados:", error);
      toast.error("No se pudieron cargar los empleados");
      setEmpleados([]);
      return [];
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const checkCajaStatus = async () => {
    setIsLoading(true);
    try {
      // Obtener ID de sucursal actual
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      if (!sucursalId) {
        console.warn("⚠️ No hay sucursal seleccionada para verificar caja");
        setCajaActual(null);
        setMovimientos([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`🔍 Verificando estado de caja para sucursal ${sucursalId}...`);
      
      try {
        const data = await cajaService.getCajaActual();
        
        console.log(`✅ Caja encontrada para sucursal ${sucursalId}:`, data);
        
        // Verificar que la caja pertenezca a la sucursal actual
        if (data && data.sucursal && Number(data.sucursal) !== Number(sucursalId)) {
          console.warn(`⚠️ La caja abierta (ID: ${data.id}) pertenece a otra sucursal (${data.sucursal}), pero la sucursal actual es ${sucursalId}`);
          // Mostrar advertencia pero permitir ver la caja
          toast.warning(`Hay una caja abierta en otra sucursal. Ciérrela antes de abrir una nueva en esta sucursal.`);
        }
        
        setCajaActual(data);
        
        // Si hay una caja abierta, cargamos sus movimientos
        if (data && data.id) {
          await cargarMovimientos(data.id);
          
          // Obtener ventas (pedidos) de la caja
          let ventasCaja = [];
          try {
            const allPedidos = await pedidoService.getAllPedidos({
              sucursal_id: sucursalId // Filtrar por sucursal actual
            });
            ventasCaja = allPedidos.filter(pedido => pedido.caja === data.id);
            console.log(`💰 ${ventasCaja.length} ventas encontradas para esta caja en sucursal ${sucursalId}`);
          } catch (error) {
            console.error("❌ Error al obtener ventas de la caja:", error);
            ventasCaja = [];
          }
          
          // Calcular balance basado en monto inicial
          let balance = parseFloat(data.monto_inicial || 0);
          
          // Sumar/restar movimientos según su tipo
          movimientos.forEach(mov => {
            if (mov.tipo === 'ingreso') {
              balance += parseFloat(mov.monto || 0);
            } else if (mov.tipo === 'retiro') {
              balance -= parseFloat(mov.monto || 0);
            }
          });
          
          // Calcular el total de ventas (todas las formas de pago)
          const totalVentas = ventasCaja.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
          
          // Sumar solo los pagos en efectivo al balance
          ventasCaja.forEach(venta => {
            // Verificar si la venta tiene transacciones
            if (venta.transacciones && Array.isArray(venta.transacciones)) {
              // Sumar solo los pagos en efectivo (tipo_pago_id = 1 generalmente)
              venta.transacciones.forEach(trans => {
                if (trans.tipo_pago_id === 1) { // Asumiendo que 1 = Efectivo
                  balance += parseFloat(trans.monto || 0);
                }
              });
            }
          });
          
          // Actualizar el balance y total de ventas en cajaActual
          setCajaActual(prev => ({
            ...prev,
            balance_actual: balance + totalVentas,
            total_ventas: totalVentas
          }));
        }
      } catch (error) {
        // Verificar si es el error esperado de que no hay caja abierta
        if (error.response && error.response.status === 404) {
          // Esto es normal, simplemente significa que no hay caja abierta
          setCajaActual(null);
          setMovimientos([]);
          console.log(`ℹ️ No hay caja abierta actualmente en sucursal ${sucursalId}`);
        } else {
          throw error; // Re-lanzar para ser manejado en el catch principal
        }
      }
    } catch (error) {
      console.error("❌ Error al verificar estado de caja:", error);
      toast.error("Error al verificar el estado de la caja");
      setCajaActual(null);
      setMovimientos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openAperturaModal = async () => {
    setShowAperturaModal(true);
    setLoadingEmpleados(true);
    setEmpleadoId(""); // Resetear la selección de empleado
    
    try {
      // Cargar empleados específicos para la sucursal actual
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      if (sucursalId) {
        await fetchEmpleados(sucursalId);
      } else {
        await fetchEmpleados();
      }
    } catch (error) {
      console.error("Error al cargar empleados para apertura:", error);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const handleAbrirCaja = async () => {
    // Convertir el monto a un número y validar
    const montoNumerico = parseFloat(montoInicial.replace(/,/g, '.').trim());
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("Por favor ingrese un monto inicial válido mayor a cero");
      return;
    }

    // Verificar si hay una sucursal seleccionada
    const sucursalId = localStorage.getItem('sucursal_actual_id');
    if (!sucursalId) {
      toast.error("Debe seleccionar una sucursal para abrir la caja");
      return;
    }

    try {
      setIsLoading(true);
      const cajaData = {
        monto_inicial: montoNumerico,
        empleado: empleadoId ? Number(empleadoId) : null
      };
      
      console.log(`📝 Enviando datos para abrir caja en sucursal ${sucursalId}:`, cajaData);
      await cajaService.abrirCaja(cajaData);
      
      toast.success(`¡Caja abierta exitosamente en ${sucursalActual?.nombre || 'la sucursal seleccionada'}!`);
      setShowAperturaModal(false);
      
      // Actualizar el estado de la caja
      await checkCajaStatus();
      
      // Opcional: redirigir a la página de ventas
      // navigate('/admin/ventas');
    } catch (error) {
      console.error("❌ Error al abrir caja:", error);
      toast.error(error.response?.data?.error || "Error al abrir la caja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      setIsLoading(true);
      
      // Intentar verificar si la caja sigue abierta
      let cajaAbierta = true;
      try {
        await cajaService.getCajaActual();
      } catch (error) {
        if (error.response && error.response.status === 404) {
          cajaAbierta = false;
        } else {
          throw error; // Re-lanzar otros errores
        }
      }
      
      // Si la caja ya está cerrada, solo actualizamos la UI
      if (!cajaAbierta) {
        toast.info(`La caja ya estaba cerrada en ${sucursalActual?.nombre || 'esta sucursal'}. Actualizando vista...`);
        setCajaActual(null);
        setMovimientos([]);
        setShowCierreModal(false);
        return;
      }
      
      // Si la caja sigue abierta, procedemos con el cierre normal
      const result = await cajaService.cerrarCaja();
      toast.success(`¡Caja cerrada exitosamente en ${sucursalActual?.nombre || 'la sucursal actual'}!`);
      setShowCierreModal(false);
      setCajaActual(null);
      setMovimientos([]);
      
      // Mostrar resumen del cierre
      const resumen = `
        Sucursal: ${sucursalActual?.nombre || 'N/A'}
        Total en efectivo: $${result.total_efectivo}
        Total en tarjeta: $${result.total_tarjeta}
        Total en QR/transferencia: $${result.total_qr}
        Monto final: $${result.monto_final}
      `;
      toast.info(resumen);
    } catch (error) {
      console.error("❌ Error al cerrar caja:", error);
      const errorMsg = error.response?.data?.error || "Error al cerrar la caja";
      toast.error(errorMsg);
       
      // Si el error indica que no hay caja abierta, actualizamos la UI
      if (errorMsg.includes("No hay caja") || (error.response && error.response.status === 404)) {
        setCajaActual(null);
        setMovimientos([]);
        setShowCierreModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold title-icon flex items-center">
            <Wallet className="h-8 w-8 mr-2 icon-accent" />
            Administración de Caja
            {sucursalActual?.id && (
              <span className="ml-3 text-lg bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center">
                <Store className="h-4 w-4 mr-1" /> {sucursalActual.nombre}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            {!sucursalActual?.id ? (
              "Seleccione una sucursal para gestionar su caja."
            ) : cajaActual ? (
              `Gestione la caja actual de ${sucursalActual.nombre}, registre movimientos de efectivo y realice el cierre cuando termine su turno.`
            ) : (
              `Abra una nueva caja para comenzar a registrar ventas en ${sucursalActual.nombre}.`
            )}
          </p>
        </header>

        {isLoading && !showAperturaModal && !showCierreModal ? (
          <LoadingSpinner />
        ) : (
          <>
            {cajaActual ? (
              <CajaAbierta 
                cajaActual={cajaActual}
                movimientos={movimientos}
                empleados={empleados}
                navigate={navigate}
                setShowMovimientoModal={setShowMovimientoModal}
                setShowCierreModal={setShowCierreModal}
                sucursalActual={sucursalActual} // Pasar la sucursal actual
              />
            ) : (
              <CajaCerrada 
                setShowAperturaModal={openAperturaModal} // Usar la nueva función en lugar del setter directo
                sucursalActual={sucursalActual} // Pasar la sucursal actual
              />
            )}
          </>
        )}
      </div>
      
      {showAperturaModal && (
        <AperturaModal 
          setShowAperturaModal={setShowAperturaModal}
          montoInicial={montoInicial}
          setMontoInicial={setMontoInicial}
          empleadoId={empleadoId}
          setEmpleadoId={setEmpleadoId}
          empleados={empleados}
          setEmpleados={setEmpleados} // Añadido: Pasar setEmpleados
          loadingEmpleados={loadingEmpleados}
          setLoadingEmpleados={setLoadingEmpleados} // Añadido: Pasar setLoadingEmpleados
          isLoading={isLoading}
          handleAbrirCaja={handleAbrirCaja}
          sucursalActual={sucursalActual}
        />
      )}
      
      {showCierreModal && (
        <CierreModal 
          setShowCierreModal={setShowCierreModal}
          cajaActual={cajaActual}
          movimientos={movimientos}
          isLoading={isLoading}
          handleCerrarCaja={handleCerrarCaja}
          sucursalActual={sucursalActual} // Pasar la sucursal actual
          // Función para actualizar el estado
          onCajaCerrada={() => {
            setCajaActual(null); // Actualizar el estado para mostrar que no hay caja abierta
            setMovimientos([]); // Limpiar los movimientos
          }}
        />
      )}
      
      {showMovimientoModal && (
        <MovimientoModal 
          setShowMovimientoModal={setShowMovimientoModal}
          movimientoData={movimientoData}
          setMovimientoData={setMovimientoData}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          cajaActual={cajaActual}
          movimientoService={movimientoService}
          checkCajaStatus={checkCajaStatus}
          sucursalActual={sucursalActual} // Pasar la sucursal actual
        />
      )}
    </div>
  );
};

export default CajaManager;





