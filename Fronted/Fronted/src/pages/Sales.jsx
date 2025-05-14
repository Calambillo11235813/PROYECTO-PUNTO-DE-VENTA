import React, { useState, useEffect } from 'react';
import { Barcode } from 'lucide-react';
import ProductCard from '../components/ProductCart';
import { productoService } from '../services/productoService';
import { pedidoService } from '../services/pedidoService';
import Barra_busqueda from '../components/barra_busqueda';
import ShoppingCart from '../components/ShoppingCart';
import { toast } from 'react-toastify';

const VentasView = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cliente, setCliente] = useState('Consumidor Final');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([{ amount: '', method: 'Efectivo' }]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [processingOrder, setProcessingOrder] = useState(false);

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
        toast?.error('Error al cargar productos');
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

  const handleFinalizarVenta = async () => {
    if (cartItems.length === 0) {
      toast.error('No hay productos en el carrito');
      return;
    }

    const sumPayments = paymentMethods.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );
    
    if (Math.abs(sumPayments - total) > 0.01) {
      toast.error('La suma de los pagos debe ser igual al total de la venta');
      return;
    }

    try {
      setProcessingOrder(true);
      
      const pedidoData = {
        estado_id: 1,
        tipo_venta_id: getMetodoPagoId(paymentMethods[0].method),
        total: total,
        detalles_input: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad
        })),
        payment_methods: paymentMethods
      };

      const resultado = await pedidoService.createPedido(pedidoData);
      
      toast.success(`¡Venta finalizada con éxito!\nTotal: $${total.toFixed(2)}`);
      setCartItems([]);
      setPaymentMethods([{ amount: '', method: 'Efectivo' }]);
      
    } catch (error) {
      console.error('Error al finalizar la venta:', error);
      toast.error(`Error al finalizar la venta: ${error.message}`);
    } finally {
      setProcessingOrder(false);
    }
  };

  const getMetodoPagoId = (metodo) => {
    const metodosMap = {
      'Efectivo': 1,
      'Tarjeta de Crédito': 2,
      'Tarjeta de Débito': 3,
      'Transferencia': 4
    };
    
    return metodosMap[metodo] || 1;
  };
  
  const handleBarcodeSearch = () => {
    const barcode = prompt('Escanea o ingresa el código de barras:');
    if (!barcode) return;
    
    const product = products.find(p => p.codigo_barras === barcode || p.id.toString() === barcode);
    
    if (product) {
      handleAddToCart(product);
    } else {
      alert('Producto no encontrado');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="py-4 px-6 bg-white border-b">
        <h1 className="text-xl font-medium text-green-600">Punto de Venta</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-4 overflow-y-auto">
          <div className="mb-4 flex">
            <div className="flex-1">
              <Barra_busqueda 
                onSelectProduct={handleSelectProduct}
                onSearchChange={handleSearchChange} 
              />
            </div>
            <button 
              className="ml-2 px-4 py-2 bg-gray-600 text-white rounded flex items-center"
              onClick={handleBarcodeSearch}
            >
              <Barcode className="h-5 w-5 mr-1" />
              <span>Código de Barras</span>
            </button>
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
            cliente={cliente}
            setCliente={setCliente}
            total={total}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            onFinalizarVenta={handleFinalizarVenta}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            processingOrder={processingOrder}
          />
        </div>
      </div>
    </div>
  );
};

export default VentasView;