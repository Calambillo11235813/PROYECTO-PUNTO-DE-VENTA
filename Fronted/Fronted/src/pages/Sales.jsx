import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Barcode, PlusCircle, MinusCircle, ShoppingCart } from "lucide-react";


const Sales = () => {
  // Utilizamos el contexto de AdminLayout
  const [darkMode, toggleDarkMode, activePage, setActivePage] = useOutletContext();

  // Configuramos el título de la página
  useEffect(() => {
    setActivePage("Punto de Venta");
  }, [setActivePage]);

  // Estados específicos de ventas
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([
    { id: 1, name: 'Laptop Dell XPS', price: 1299.99, barcode: '123456789', inStock: 15 },
    { id: 2, name: 'Monitor LG 27"', price: 249.99, barcode: '987654321', inStock: 8 },
    { id: 3, name: 'Teclado Mecánico', price: 89.99, barcode: '456789123', inStock: 22 },
    { id: 4, name: 'Mouse Inalámbrico', price: 39.99, barcode: '789123456', inStock: 30 },
    { id: 5, name: 'Auriculares Sony', price: 129.99, barcode: '321654987', inStock: 12 },
  ]);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Consumidor Final');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleBarcodeSearch = () => {
    const product = products.find((p) => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
      setShowBarcodeInput(false);
    } else {
      alert('Producto no encontrado');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.16; // 16% de impuestos
  const total = subtotal + tax;

  const handleCheckout = () => {
    alert(`Venta completada: $${total.toFixed(2)}`);
    setCart([]);
  };

  return (
    <div className="sales-container">
      <div className="sales-left-panel">
        <div className="sales-controls">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="barcode-btn"
            onClick={() => setShowBarcodeInput(!showBarcodeInput)}
          >
            <Barcode size={18} />
            Escanear Código
          </button>
        </div>

        {showBarcodeInput && (
          <div className="barcode-input-container">
            <input
              type="text"
              placeholder="Escanee o ingrese el código..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <button onClick={handleBarcodeSearch}>Buscar</button>
          </div>
        )}

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => addToCart(product)}
            >
              <div className="product-img-placeholder"></div>
              <h3>{product.name}</h3>
              <div className="product-price">${product.price.toFixed(2)}</div>
              <div className="product-stock">
                Stock: {product.inStock} unidades
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sales-right-panel">
        <div className="cart-header">
          <h2>Carrito de Compra</h2>
          <div className="customer-selector">
            <label>Cliente:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="Consumidor Final">Consumidor Final</option>
              <option value="Juan Pérez">Juan Pérez</option>
              <option value="María López">María López</option>
              <option value="Carlos Gómez">Carlos Gómez</option>
            </select>
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} />
              <p>El carrito está vacío</p>
              <p>Agrega productos haciendo clic en ellos</p>
            </div>
          ) : (
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <MinusCircle size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <PlusCircle size={16} />
                        </button>
                      </div>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA (16%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="payment-method">
            <label>Método de Pago:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta de Crédito/Débito</option>
              <option value="transferencia">Transferencia Bancaria</option>
            </select>
          </div>

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Completar Venta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;