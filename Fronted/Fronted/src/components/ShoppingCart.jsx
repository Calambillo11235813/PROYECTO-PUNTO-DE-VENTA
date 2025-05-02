import React from 'react';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, Loader } from 'lucide-react';

const ShoppingCart = ({ 
  cartItems, 
  cliente, 
  setCliente, 
  subtotal, 
  impuestos, 
  total, 
  metodoPago, 
  setMetodoPago, 
  onFinalizarVenta, 
  onRemoveItem, 
  onUpdateQuantity,
  processingOrder = false // Nuevo prop para controlar estado de procesamiento
}) => {
  return (
    <div className="w-full h-full bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Carrito de Compras</h2>
        <div className="flex items-center">
          <span className="mr-2">Cliente:</span>
          <select 
            className="border rounded p-1"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            disabled={processingOrder} // Deshabilitar durante procesamiento
          >
            <option>Consumidor Final</option>
            <option>Cliente Registrado</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <CartIcon className="h-16 w-16 mb-3" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{item.nombre}</h3>
                  <button 
                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    onClick={() => onRemoveItem(item.id)}
                    title="Eliminar producto"
                    disabled={processingOrder} // Deshabilitar durante procesamiento
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center border rounded">
                    <button 
                      className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1 || processingOrder} // Deshabilitar durante procesamiento
                      title="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="text"
                      className="w-12 text-center border-x py-1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          onUpdateQuantity(item.id, value);
                        }
                      }}
                      disabled={processingOrder} // Deshabilitar durante procesamiento
                    />
                    <button 
                      className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                      title="Aumentar cantidad"
                      disabled={processingOrder} // Deshabilitar durante procesamiento
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">${Number(item.precio_venta).toFixed(2)} c/u</div>
                    <div className="font-semibold">${(item.cantidad * Number(item.precio_venta)).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t bg-white">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos (16%):</span>
            <span>${impuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Método de pago:</label>
          <select 
            className="w-full border rounded p-2"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            disabled={processingOrder} // Deshabilitar durante procesamiento
          >
            <option>Efectivo</option>
            <option>Tarjeta de Crédito</option>
            <option>Tarjeta de Débito</option>
            <option>Transferencia</option>
          </select>
        </div>
        
        <button 
          className={`w-full ${processingOrder ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 rounded font-medium transition-colors flex items-center justify-center`}
          onClick={onFinalizarVenta}
          disabled={cartItems.length === 0 || processingOrder}
        >
          {processingOrder ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Procesando...
            </>
          ) : (
            'Finalizar Venta'
          )}
        </button>
      </div>
    </div>
  );
};

export default ShoppingCart;