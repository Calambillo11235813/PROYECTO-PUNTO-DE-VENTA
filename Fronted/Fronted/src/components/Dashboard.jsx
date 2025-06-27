import React, { useEffect, useState } from "react"; 
import { useOutletContext, useNavigate } from "react-router-dom";
import { productoService } from "../services/productoService";
import { pedidoService } from "../services/pedidoService"; // Importar el servicio de pedidos
import { FaExclamationTriangle } from "react-icons/fa";

const Dashboard = () => {
  // Obtenemos el contexto del AdminLayout 
  const [ , , , setActivePage ] = useOutletContext();
  const [productosConAlerta, setProductosConAlerta] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(true);
  const [errorAlertas, setErrorAlertas] = useState(null);
  const navigate = useNavigate(); // Hook de navegación
  
  // Nuevos estados para las estadísticas de ventas
  const [ventasDelDia, setVentasDelDia] = useState({
    total: 0,
    cantidad: 0,
    cargando: true,
    error: null,
    incremento: 0
  });

  // Aseguramos que el título de la página sea "Dashboard"
  useEffect(() => {
    setActivePage("Dashboard");
  }, [setActivePage]);

  // Definir las rutas para las acciones rápidas (extraídas del Sidebar)
  const rutas = {
    nuevaVenta: "/admin/ventas",        // Punto de Venta
    nuevoProducto: "/admin/inventario", // Inventario
    reportes: "/admin/reportes",        // Reportes
    empleados: "/admin/empleados"       // Empleados
  };

  // Funciones de navegación
  const navegarA = (ruta) => {
    navigate(ruta);
  };

  // Utilidad para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Obtener ventas del día actual
  useEffect(() => {
    const obtenerVentasDelDia = async () => {
      try {
        // Obtener el ID del usuario y de la sucursal (si está disponible)
        const userId = localStorage.getItem('id');
        const sucursalId = localStorage.getItem('sucursal_actual_id');
        
        // Obtener la fecha actual en formato YYYY-MM-DD
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];
        
        // Obtener la fecha de ayer
        const ayer = new Date();
        ayer.setDate(hoy.getDate() - 1);
        const fechaAyer = ayer.toISOString().split('T')[0];
        
        console.log('Fecha de hoy:', fechaHoy);
        console.log('Fecha de ayer:', fechaAyer);
        
        // Obtener todos los pedidos
        let pedidos;
        if (sucursalId) {
          pedidos = await pedidoService.getPedidosBySucursal(userId, sucursalId);
        } else {
          pedidos = await pedidoService.getAllPedidos();
        }
        
        // Filtrar pedidos de hoy
        const pedidosHoy = pedidos.filter(pedido => {
          // Asegurarse de que la fecha del pedido está en formato YYYY-MM-DD
          const fechaPedido = new Date(pedido.fecha).toISOString().split('T')[0];
          return fechaPedido === fechaHoy;
        });
        
        // Filtrar pedidos de ayer
        const pedidosAyer = pedidos.filter(pedido => {
          const fechaPedido = new Date(pedido.fecha).toISOString().split('T')[0];
          return fechaPedido === fechaAyer;
        });
        
        // Calcular total de ventas de hoy
        const totalHoy = pedidosHoy.reduce((suma, pedido) => 
          suma + parseFloat(pedido.total || 0), 0);
          
        // Calcular total de ventas de ayer
        const totalAyer = pedidosAyer.reduce((suma, pedido) => 
          suma + parseFloat(pedido.total || 0), 0);
        
        // Calcular incremento porcentual
        let incremento = 0;
        if (totalAyer > 0) {
          incremento = ((totalHoy - totalAyer) / totalAyer) * 100;
        }
        
        setVentasDelDia({
          total: totalHoy,
          cantidad: pedidosHoy.length,
          cargando: false,
          error: null,
          incremento: incremento
        });
        
        console.log('Ventas de hoy:', {
          total: totalHoy,
          cantidad: pedidosHoy.length,
          incremento: incremento
        });
        
      } catch (error) {
        console.error('Error al obtener ventas del día:', error);
        setVentasDelDia(prev => ({
          ...prev,
          cargando: false,
          error: 'No se pudieron cargar las ventas del día'
        }));
      }
    };
    
    obtenerVentasDelDia();
  }, []);

  // Obtener productos con stock bajo (mantener el código existente)
  useEffect(() => {
    const obtenerProductosConAlerta = async () => {
      setCargandoAlertas(true);
      setErrorAlertas(null);
      
      try {
        const userId = localStorage.getItem('id');
        const sucursalId = localStorage.getItem('sucursal_actual_id');
        
        // Si hay una sucursal seleccionada, obtener productos de esa sucursal
        // De lo contrario, obtener todos los productos
        let productos = [];
        if (sucursalId) {
          productos = await productoService.getProductosBySucursal(userId, sucursalId);
        } else {
          productos = await productoService.getAllProducts();
        }
        
        // Filtrar productos que tienen stock bajo o crítico
        // Se considera crítico si el stock es menor al mínimo
        // Se considera bajo si el stock está dentro del 20% por encima del mínimo
        const productosAlerta = productos
          .filter(producto => {
            const stockMinimo = producto.cantidad_minima || 5; // Valor por defecto si no tiene mínimo
            const stockActual = producto.stock || 0;
            const umbralBajo = stockMinimo * 1.2; // 20% por encima del mínimo
            
            return stockActual <= umbralBajo; // Incluir productos con stock bajo o crítico
          })
          .map(producto => {
            const stockMinimo = producto.cantidad_minima || 5;
            const stockActual = producto.stock || 0;
            
            let estado = '';
            let colorFondo = '';
            
            if (stockActual === 0) {
              estado = 'Sin stock';
              colorFondo = 'bg-red-100';
            } else if (stockActual < stockMinimo) {
              estado = `Stock crítico (${stockActual})`;
              colorFondo = 'bg-red-100';
            } else {
              estado = `Stock bajo (${stockActual})`;
              colorFondo = 'bg-yellow-100';
            }
            
            return {
              ...producto,
              estado,
              colorFondo,
              minimo: producto.cantidad_minima || 5
            };
          })
          .sort((a, b) => {
            // Ordenar por criticidad: primero sin stock, luego crítico, luego bajo
            if (a.stock === 0 && b.stock !== 0) return -1;
            if (a.stock !== 0 && b.stock === 0) return 1;
            if (a.stock < a.minimo && b.stock >= b.minimo) return -1;
            if (a.stock >= a.minimo && b.stock < b.minimo) return 1;
            return 0;
          });
        
        setProductosConAlerta(productosAlerta);
      } catch (error) {
        console.error('Error al obtener productos con alerta:', error);
        setErrorAlertas('No se pudieron cargar las alertas de inventario');
      } finally {
        setCargandoAlertas(false);
      }
    };
    
    obtenerProductosConAlerta();
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {/* Card de ventas del día con datos dinámicos */}
        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Ventas del día</h3>
          {ventasDelDia.cargando ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mr-2"></div>
              <span>Cargando...</span>
            </div>
          ) : ventasDelDia.error ? (
            <div className="text-sm text-red-600">{ventasDelDia.error}</div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(ventasDelDia.total)}</div>
              <p className="text-sm text-gray-600">{ventasDelDia.cantidad} transacciones</p>
            </>
          )}
        </div>

        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Transacciones</h3>
          <div className="text-2xl font-bold text-gray-900">{ventasDelDia.cantidad || 0}</div>
          <p className="text-sm text-green-600">+8% vs. ayer</p>
        </div>

        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Ticket Promedio</h3>
          <div className="text-2xl font-bold text-gray-900">
            {ventasDelDia.cantidad > 0 
              ? formatCurrency(ventasDelDia.total / ventasDelDia.cantidad) 
              : formatCurrency(0)}
          </div>
          <p className="text-sm text-green-600">+5% vs. ayer</p>
        </div>

        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Facturas Pendientes</h3>
          <div className="text-2xl font-bold text-gray-900">7</div>
          <p className="text-sm text-red-600">Requiere atención</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Ventas de la Semana</h3>
          <div className="h-44 bg-gradient-to-r from-green-500 to-blue-500 rounded-md flex items-center justify-center text-white">
            <span className="text-lg">Gráfico de Ventas</span>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Productos Más Vendidos</h3>
          <ul className="space-y-4">
            <li className="flex justify-between text-gray-700">
              <span>Laptop HP 15"</span>
              <span>125 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700">
              <span>Monitor Samsung 24"</span>
              <span>98 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700">
              <span>Mouse Logitech</span>
              <span>87 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700">
              <span>Teclado Mecánico</span>
              <span>65 vendidos</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenedores inferiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            Alertas de Inventario
          </h3>
          
          {cargandoAlertas ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">Cargando alertas...</span>
            </div>
          ) : errorAlertas ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              {errorAlertas}
            </div>
          ) : productosConAlerta.length > 0 ? (
            <ul className="space-y-4">
              {productosConAlerta.slice(0, 5).map((producto, index) => (
                <li key={producto.id || index} className={`flex justify-between p-3 ${producto.colorFondo} rounded-md`}>
                  <span>{producto.nombre} - {producto.estado}</span>
                  <span>Mínimo: {producto.minimo}</span>
                </li>
              ))}
              {productosConAlerta.length > 5 && (
                <li className="text-center text-sm text-gray-500 pt-2">
                  Y {productosConAlerta.length - 5} más...
                </li>
              )}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              ¡Todo en orden! No hay productos con stock crítico.
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 text-lg">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Botones con funcionalidad de navegación */}
            <button 
              className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              onClick={() => navegarA(rutas.nuevaVenta)}
              aria-label="Ir a Punto de Venta"
            >
              Nueva Venta
            </button>
            
            <button 
              className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              onClick={() => navegarA(rutas.nuevoProducto)}
              aria-label="Ir a Inventario"
            >
              Nuevo Producto
            </button>
            
            <button 
              className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              onClick={() => navegarA(rutas.reportes)}
              aria-label="Ir a Reportes"
            >
              Reportes
            </button>
            
            <button 
              className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              onClick={() => navegarA(rutas.empleados)}
              aria-label="Ir a Empleados"
            >
              Añadir empleado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
