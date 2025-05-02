import React, { useState, useEffect } from 'react';
import { Barcode } from 'lucide-react';
import ProductCard from '../components/ProductCart';
import { productoService } from '../services/productoService';
import { pedidoService } from '../services/pedidoService'; // Importar el servicio de pedidos
import Barra_busqueda from '../components/barra_busqueda';
import ShoppingCart from '../components/ShoppingCart';
import { toast } from 'react-toastify'; // Opcional: para mostrar notificaciones

const VentasView = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cliente, setCliente] = useState('Consumidor Final');
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [impuestos, setImpuestos] = useState(0);
  const [total, setTotal] = useState(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [processingOrder, setProcessingOrder] = useState(false); // Estado para controlar el procesamiento de pedidos

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
        // Inicialmente, solo mostramos las primeras 10 tarjetas
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
    // Calcular subtotal
    const newSubtotal = cartItems.reduce((sum, item) => sum + (Number(item.precio_venta) * item.cantidad), 0);
    setSubtotal(newSubtotal);
    
    // Calcular impuestos (16%)
    const newImpuestos = newSubtotal * 0.16;
    setImpuestos(newImpuestos);
    
    // Calcular total
    setTotal(newSubtotal + newImpuestos);
  }, [cartItems]);

  // Esta función se mantiene para manejar clics en ProductCard
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
  
  // Esta función manejará la selección desde la barra de búsqueda
  const handleSelectProduct = (product) => {
    handleAddToCart(product);
  };
  
  // Nueva función para eliminar un item del carrito
  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  // Nueva función para actualizar la cantidad de un producto en el carrito
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
  
  // Función para filtrar productos desde la barra de búsqueda
  const handleSearchChange = (query) => {
    setSearchTerm(query);
    
    if (query.trim() === '') {
      // Si no hay búsqueda, volvemos a mostrar solo 10 productos
      setFilteredProducts(products.slice(0, 10));
      return;
    }
    
    // Filtrar todos los productos que coincidan con la búsqueda
    const filtered = products.filter(product => 
      product.nombre?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  };

  // Función actualizada para finalizar venta y crear pedido
  const handleFinalizarVenta = async () => {
    if (cartItems.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }

    try {
      setProcessingOrder(true);
      
      // Mapear la información del carrito al formato requerido por el backend
      const pedidoData = {
        estado_id: 1, // Estado inicial (por ejemplo: 1 = pendiente)
        tipo_venta_id: getMetodoPagoId(metodoPago), // Convertir método de pago a ID
        detalles: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad
          // No incluimos precio_unitario ya que el backend no lo espera
        }))
      };

      console.log('Enviando pedido:', pedidoData);
      
      // Llamar al servicio para crear el pedido
      const resultado = await pedidoService.createPedido(pedidoData);
      
      console.log('Pedido creado exitosamente:', resultado);
      
      // Mostrar mensaje de éxito
      alert(`¡Venta finalizada con éxito!\nTotal: $${total.toFixed(2)}`);
      
      // Resetear el carrito después de crear el pedido
      setCartItems([]);
      
      // Opcional: Generar recibo o redireccionar a página de recibo
      // window.open(`/recibos/${resultado.id}`, '_blank');
      
    } catch (error) {
      console.error('Error al finalizar la venta:', error);
      
      // Mensaje de error más detallado
      let errorMessage = 'Intente nuevamente';
      
      if (error.response && error.response.data) {
        // Intentar extraer mensaje de error de la respuesta
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          // Si hay múltiples errores en diferentes campos
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error al finalizar la venta: ${errorMessage}`);
    } finally {
      setProcessingOrder(false);
    }
  };
  
  // Función para convertir el método de pago seleccionado a su ID correspondiente
  // Esto debe adaptarse según la estructura de tu base de datos
  const getMetodoPagoId = (metodo) => {
    const metodosMap = {
      'Efectivo': 1,
      'Tarjeta de Crédito': 2,
      'Tarjeta de Débito': 3,
      'Transferencia': 4
    };
    
    return metodosMap[metodo] || 1; // Valor por defecto: 1 (efectivo)
  };
  
  // Función para manejar el escaneo de códigos de barras
  const handleBarcodeSearch = () => {
    const barcode = prompt('Escanea o ingresa el código de barras:');
    if (!barcode) return;
    
    // Buscar producto por código de barras (esto debería adaptarse a tus datos)
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
        {/* Sección de productos */}
        <div className="w-2/3 p-4 overflow-y-auto">
          <div className="mb-4 flex">
            {/* Integración de la barra de búsqueda */}
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
              {/* Mostrar resultado de búsqueda si hay término de búsqueda */}
              {searchTerm && (
                <div className="mb-3 text-gray-600">
                  {filteredProducts.length === 0 
                    ? 'No se encontraron productos que coincidan con tu búsqueda.' 
                    : `Se encontraron ${filteredProducts.length} producto(s) para "${searchTerm}"`
                  }
                </div>
              )}
              
              {/* Cuadrícula de productos */}
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
        
        {/* Sección de carrito - Reemplazada por el componente ShoppingCart */}
        <div className="w-1/3">
          <ShoppingCart 
            cartItems={cartItems}
            cliente={cliente}
            setCliente={setCliente}
            subtotal={subtotal}
            impuestos={impuestos}
            total={total}
            metodoPago={metodoPago}
            setMetodoPago={setMetodoPago}
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