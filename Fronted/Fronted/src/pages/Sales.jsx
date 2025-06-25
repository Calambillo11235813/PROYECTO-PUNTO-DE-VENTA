import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCart';
import { productoService } from '../services/productoService';
import { pedidoService } from '../services/pedidoService';
import { cajaService } from '../services/cajaService';
import Barra_busqueda from '../components/barra_busqueda';
import ShoppingCart from '../components/ShoppingCart';
import { toast } from 'react-toastify';
import { Store } from 'lucide-react'; // Importar ícono para sucursal

const VentasView = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([{ amount: '', method: 'Efectivo' }]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cajaActual, setCajaActual] = useState(null);
  const [loadingCaja, setLoadingCaja] = useState(true);
  // Nuevo estado para la sucursal actual
  const [sucursalActual, setSucursalActual] = useState(null);
  const [componentKey, setComponentKey] = useState(Date.now()); // Nuevo estado para refrescar el componente
  const navigate = useNavigate();

  // Cargar información de la sucursal actual al inicio
  useEffect(() => {
    const cargarSucursalActual = () => {
      const sucursalId = localStorage.getItem('sucursal_actual_id');
      const sucursalNombre = localStorage.getItem('sucursal_actual_nombre');
      
      console.log(`🏪 Cargando información de sucursal - ID: ${sucursalId}, Nombre: ${sucursalNombre}`);
      
      if (sucursalId && sucursalNombre) {
        setSucursalActual({
          id: parseInt(sucursalId),
          nombre: sucursalNombre
        });
      } else {
        toast.warning("No hay una sucursal seleccionada. Por favor seleccione una sucursal.");
      }
    };
    
    cargarSucursalActual();
    
    // Escuchar cambios de sucursal
    window.addEventListener('sucursalChanged', cargarSucursalActual);
    
    return () => {
      window.removeEventListener('sucursalChanged', cargarSucursalActual);
    };
  }, []);

  // Verificar si hay una caja abierta al cargar la página o cuando cambia la sucursal
  useEffect(() => {
    const verificarCaja = async () => {
      if (!sucursalActual?.id) {
        console.log("⚠️ No hay sucursal seleccionada para verificar caja");
        return;
      }
      
      setLoadingCaja(true);
      try {
        console.log(`🔍 Verificando caja para sucursal ${sucursalActual.id}...`);
        const data = await cajaService.getCajaActual();
        setCajaActual(data);
        console.log(`✅ Caja cargada para sucursal ${sucursalActual.id}:`, data);
      } catch (error) {
        console.error(`❌ Error al verificar caja para sucursal ${sucursalActual.id}:`, error);
        if (error.response && error.response.status === 404) {
          toast.error(`No hay una caja abierta en ${sucursalActual.nombre}. Debe abrir una caja antes de realizar ventas.`);
          navigate('/admin/caja');
        }
      } finally {
        setLoadingCaja(false);
      }
    };
    
    if (sucursalActual) {
      verificarCaja();
    }
  }, [sucursalActual, navigate]);

  // Cargar pedidos específicos de la sucursal actual
  useEffect(() => {
    const fetchPedidos = async () => {
      if (!cajaActual || !sucursalActual?.id) {
        return;
      }
      
      try {
        console.log(`🔍 Cargando pedidos para sucursal ${sucursalActual.id}...`);
        // Usar el método específico para obtener pedidos por sucursal
        const data = await pedidoService.getPedidosBySucursal(
          localStorage.getItem('id'),
          sucursalActual.id
        );
        console.log(`✅ ${data.length} pedidos cargados para sucursal ${sucursalActual.id}:`, data);
        setPedidos(data);
      } catch (error) {
        console.error(`❌ Error al cargar pedidos para sucursal ${sucursalActual.id}:`, error);
        toast.error(`Error al cargar el historial de ventas en ${sucursalActual.nombre}`);
      }
    };

    fetchPedidos();
  }, [cajaActual, sucursalActual]);

  // Cargar productos filtrados por sucursal
  useEffect(() => {
    const fetchProducts = async () => {
      if (!sucursalActual?.id) {
        return;
      }
      
      try {
        setLoading(true);
        console.log(`🔍 Cargando productos para sucursal ${sucursalActual.id}...`);
        
        let productosData;
        
        // Intentar obtener productos específicos de la sucursal
        if (productoService.getProductosBySucursal) {
          try {
            // Obtener el ID del usuario actual del localStorage
            const userId = localStorage.getItem('id');

            // Asegurarse de pasar AMBOS parámetros: userId y sucursalId
            productosData = await productoService.getProductosBySucursal(userId, sucursalActual.id);
            console.log(`✅ Se encontraron ${productosData.length} productos específicos para sucursal ${sucursalActual.id}`);
          } catch (error) {
            console.warn(`⚠️ No se pudieron obtener productos específicos para la sucursal: ${error.message}`);
            // Si falla, cargar todos los productos como fallback
            productosData = await productoService.getAllProducts();
            console.log(`ℹ️ Usando todos los productos disponibles como alternativa`);
          }
        } else {
          // Si no existe el método, usar getAllProducts
          productosData = await productoService.getAllProducts();
        }
        
        // Formatear datos
        const formattedData = Array.isArray(productosData) ? productosData.map(product => ({
          ...product,
          precio_venta: Number(product.precio_venta),
          precio_compra: Number(product.precio_compra),
          stock_inicial: Number(product.stock_inicial)
        })) : [];
        
        console.log(`✅ ${formattedData.length} productos cargados para la vista de ventas`);
        setProducts(formattedData);
        setFilteredProducts(formattedData.slice(0, 10));
      } catch (error) {
        console.error(`❌ Error al cargar productos para sucursal ${sucursalActual.id}:`, error);
        toast.error(`Error al cargar productos en ${sucursalActual.nombre}`);
      } finally {
        setLoading(false);
      }
    };

    if (sucursalActual) {
      fetchProducts();
    }
  }, [sucursalActual]);

  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => 
      sum + (Number(item.precio_venta) * item.cantidad), 0
    );
    setTotal(newTotal);
  }, [cartItems]);

  const handleAddToCart = (product) => {
    // Verificar que haya una sucursal seleccionada
    if (!sucursalActual?.id) {
      toast.error("Debe seleccionar una sucursal antes de realizar ventas.");
      return;
    }
    
    // Verificar si hay una caja abierta antes de agregar productos
    if (!cajaActual) {
      toast.error(`No hay una caja abierta en ${sucursalActual.nombre}. Debe abrir una caja antes de realizar ventas.`);
      navigate('/admin/caja');
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, cantidad: 1 }]);
    }
  };
  
  const handleSelectProduct = (product) => {
    handleAddToCart(product);
  };
  
  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.id === productId 
        ? { ...item, cantidad: newQuantity } 
        : item
    ));
  };
  
  const handleSearchChange = (query) => {
    setSearchTerm(query);
    
    if (query.trim() === '') {
      setFilteredProducts(products.slice(0, 10));
      return;
    }
    
    const filtered = products.filter(product => 
      product.nombre?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  };

  const handleFinalizarVenta = async () => {
    // Verificar si hay productos en el carrito
    if (cartItems.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    // Verificar si hay una sucursal seleccionada
    if (!sucursalActual?.id) {
      toast.error("Debe seleccionar una sucursal para realizar ventas");
      return;
    }

    // Verificar si hay una caja abierta
    if (!cajaActual) {
      toast.error(`No hay una caja abierta en ${sucursalActual.nombre}. Debe abrir una caja antes de realizar ventas.`);
      navigate('/admin/caja');
      return;
    }

    // Verificar que los montos coincidan
    const sumPayments = paymentMethods.reduce((sum, payment) => 
      sum + Number(payment.amount || 0), 0
    );
    
    if (Math.abs(sumPayments - total) > 0.01) {
      toast.error('La suma de los pagos debe ser igual al total de la venta');
      return;
    }

    try {
      setProcessingOrder(true);
      
      // Preparar los datos del pedido con la fecha actual en formato ISO
      const pedidoData = {
        estado: 2, // Estado completado
        total: total.toFixed(2),
        tipo_venta: 1, // Venta directa
        caja_id: cajaActual.id, // ID de la caja abierta
        sucursal: parseInt(sucursalActual.id), // Asegurar que sea un número
        detalles_input: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad
        })),
        // Agregar transacciones de pago
        transacciones_input: paymentMethods.map(payment => ({
          tipo_pago_id: getTipoPagoId(payment.method),
          monto: Number(payment.amount).toFixed(2)
        }))
      };

      console.log(`📝 Datos de venta a enviar para sucursal ${sucursalActual.id}:`, pedidoData);
      
      const nuevoPedido = await pedidoService.createPedido(pedidoData);
      
      console.log(`✅ Venta #${nuevoPedido.id} registrada en sucursal ${sucursalActual.nombre}`);
      toast.success(`¡Venta #${nuevoPedido.id} finalizada en ${sucursalActual.nombre}!`);
      
      setCartItems([]);
      setPaymentMethods([{ amount: '', method: 'Efectivo' }]);
      // ...otros estados a limpiar...

      // Actualizar la lista de pedidos específicos de la sucursal
      const actualizarPedidos = await pedidoService.getPedidosBySucursal(
        localStorage.getItem('id'),
        sucursalActual.id
      );
      setPedidos(actualizarPedidos);

      // Refrescar el componente
      setComponentKey(Date.now());

    } catch (error) {
      console.error(`❌ Error al finalizar la venta en sucursal ${sucursalActual?.nombre}:`, error);
      toast.error(error.message || "Error al finalizar la venta");
    } finally {
      setProcessingOrder(false);
    }
  };

  const getTipoPagoId = (metodo) => {
    const metodosMap = {
      'Efectivo': 1,
      'Tarjeta': 2,
      'Transferencia': 3
    };
    
    return metodosMap[metodo] || 1;
  };

  const handleDeletePedido = async (pedidoId) => {
    if (!sucursalActual?.id) {
      toast.error("Debe seleccionar una sucursal para gestionar pedidos");
      return;
    }
    
    try {
      console.log(`🗑️ Eliminando pedido ${pedidoId} de sucursal ${sucursalActual.id}...`);
      await pedidoService.deletePedido(pedidoId);
      toast.success(`Pedido eliminado correctamente de ${sucursalActual.nombre}`);
      
      // Actualizar la lista de pedidos específicos de la sucursal
      const actualizarPedidos = await pedidoService.getPedidosBySucursal(
        localStorage.getItem('id'),
        sucursalActual.id
      );
      setPedidos(actualizarPedidos);
    } catch (error) {
      console.error(`❌ Error al eliminar pedido ${pedidoId}:`, error);
      toast.error('Error al eliminar el pedido');
    }
  };

  return (
    <div key={componentKey} style={{ backgroundColor: "var(--bg-tertiary)" }} className="w-full h-full flex flex-col">
      <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="py-4 px-6 border-b">
        <h1 className="text-xl font-medium title-icon flex items-center">
          Punto de Venta
          {sucursalActual && (
            <span className="ml-3 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center">
              <Store className="h-4 w-4 mr-1" /> {sucursalActual.nombre}
            </span>
          )}
        </h1>
        {cajaActual && (
          <p className="text-sm text-gray-600">
            Caja #{cajaActual.id} abierta desde {new Date(cajaActual.fecha_apertura).toLocaleString()}
            {sucursalActual && ` en ${sucursalActual.nombre}`}
          </p>
        )}
        {!sucursalActual && (
          <p className="text-sm text-red-600">
            No hay sucursal seleccionada. Por favor seleccione una sucursal para realizar ventas.
          </p>
        )}
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-4 overflow-y-auto">
          <div className="mb-4">
            <Barra_busqueda 
              onSelectProduct={handleSelectProduct}
              onSearchChange={handleSearchChange} 
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Cargando productos...</p>
            </div>
          ) : !sucursalActual ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Seleccione una sucursal para ver productos</p>
            </div>
          ) : (
            <>
              {searchTerm && (
                <div className="mb-3 text-gray-600">
                  {filteredProducts.length === 0 
                    ? 'No se encontraron productos que coincidan con tu búsqueda.' 
                    : `Se encontraron ${filteredProducts.length} producto(s) para "${searchTerm}" en ${sucursalActual.nombre}`
                  }
                </div>
              )}
              
              <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart} 
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="w-1/3">
          <ShoppingCart 
            cartItems={cartItems}
            total={total}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            onFinalizarVenta={handleFinalizarVenta}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            processingOrder={processingOrder}
            pedidos={pedidos}
            onDeletePedido={handleDeletePedido}
            cajaActual={cajaActual}
            sucursalActual={sucursalActual} // Pasar la sucursal actual al componente
          />
        </div>
      </div>
    </div>
  );
};

export default VentasView;