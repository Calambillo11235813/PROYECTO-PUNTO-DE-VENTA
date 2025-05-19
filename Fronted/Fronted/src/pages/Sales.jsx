import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCart';
import { productoService } from '../services/productoService';
import { pedidoService } from '../services/pedidoService';
import { cajaService } from '../services/cajaService';
import Barra_busqueda from '../components/barra_busqueda';
import ShoppingCart from '../components/ShoppingCart';
import { toast } from 'react-toastify';

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
  const navigate = useNavigate();

  // Cargar pedidos existentes
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const data = await pedidoService.getAllPedidos();
        setPedidos(data);
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
      }
    };

    fetchPedidos();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productoService.getAllProducts();
        const formattedData = Array.isArray(data) ? data.map(product => ({
          ...product,
          precio_venta: Number(product.precio_venta),
          precio_compra: Number(product.precio_compra),
          stock_inicial: Number(product.stock_inicial)
        })) : [];
        
        setProducts(formattedData);
        setFilteredProducts(formattedData.slice(0, 10));
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast.error('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => 
      sum + (Number(item.precio_venta) * item.cantidad), 0
    );
    setTotal(newTotal);
  }, [cartItems]);

  const handleAddToCart = (product) => {
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

  // Verificar si hay una caja abierta al cargar la página
  useEffect(() => {
    const verificarCaja = async () => {
      try {
        const data = await cajaService.getCajaActual();
        setCajaActual(data);
      } catch (error) {
        console.error("Error al verificar estado de caja:", error);
        if (error.response && error.response.status === 404) {
          toast.error("No hay una caja abierta. Debe abrir una caja antes de realizar ventas.");
          navigate('/admin/caja');
        }
      }
    };
    
    verificarCaja();
  }, [navigate]);

  const handleFinalizarVenta = async () => {
    if (cartItems.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    // Verificar si hay una caja abierta
    if (!cajaActual) {
      toast.error("No hay una caja abierta. Debe abrir una caja antes de realizar ventas.");
      navigate('/admin/caja');
      return;
    }

    const sumPayments = paymentMethods.reduce((sum, payment) => 
      sum + Number(payment.amount || 0), 0
    );
    
    if (Math.abs(sumPayments - total) > 0.01) {
      toast.error('La suma de los pagos debe ser igual al total de la venta');
      return;
    }

    try {
      setProcessingOrder(true);
      
      // Preparar los datos del pedido
      const pedidoData = {
        estado: 1, // 1 = pagado
        total: total,
        caja_id: cajaActual.id, // Usar el ID de la caja abierta
        detalles_input: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad
        })),
        transacciones_input: paymentMethods.map(payment => ({
          tipo_pago_id: getTipoPagoId(payment.method),
          monto: Number(payment.amount)
        }))
      };

      // Crear el pedido con todos los datos en una sola llamada
      await pedidoService.createPedido(pedidoData);
      
      toast.success(`¡Venta finalizada con éxito!\nTotal: $${total.toFixed(2)}`);
      setCartItems([]);
      setPaymentMethods([{ amount: '', method: 'Efectivo' }]);

      // Actualizar la lista de pedidos
      const actualizarPedidos = await pedidoService.getAllPedidos();
      setPedidos(actualizarPedidos);
      
    } catch (error) {
      console.error('Error al finalizar la venta:', error);
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
    try {
      await pedidoService.deletePedido(pedidoId);
      toast.success('Pedido eliminado correctamente');
      
      // Actualizar la lista de pedidos
      const actualizarPedidos = await pedidoService.getAllPedidos();
      setPedidos(actualizarPedidos);
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast.error('Error al eliminar el pedido');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="py-4 px-6 bg-white border-b">
        <h1 className="text-xl font-medium text-green-600">Punto de Venta</h1>
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
          ) : (
            <>
              {searchTerm && (
                <div className="mb-3 text-gray-600">
                  {filteredProducts.length === 0 
                    ? 'No se encontraron productos que coincidan con tu búsqueda.' 
                    : `Se encontraron ${filteredProducts.length} producto(s) para "${searchTerm}"`
                  }
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          />
        </div>
      </div>
    </div>
  );
};

export default VentasView;