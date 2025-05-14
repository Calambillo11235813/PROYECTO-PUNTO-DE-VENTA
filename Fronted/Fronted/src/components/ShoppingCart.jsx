import React from 'react';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, Loader } from 'lucide-react';

const ShoppingCart = ({ 
  cartItems, 
  cliente, 
  setCliente, 
  total, // Ya recibimos total como prop
  metodoPago, 
  setMetodoPago, 
  onFinalizarVenta, 
  onRemoveItem, 
  onUpdateQuantity,
  processingOrder = false
}) => {
  const [paymentMethods, setPaymentMethods] = React.useState([
    { amount: '', method: 'Efectivo' }
  ]);

  const validateTotalAmount = () => {
    const sum = paymentMethods.reduce((acc, payment) => {
      return acc + (Number(payment.amount) || 0);
    }, 0);
    return Math.abs(sum - total) > 0.01;
  };

  return (
    <div className="w-full h-full bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Carrito de Compras</h2>
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
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Métodos de pago:</label>
          <div className="space-y-2">
            {paymentMethods.map((payment, index) => {
              // Obtener métodos ya seleccionados en los índices anteriores
              const selectedMethods = paymentMethods
                .slice(0, index)
                .map(p => p.method);

              // Filtrar las opciones disponibles excluyendo las ya seleccionadas
              const availableMethods = ['Efectivo', 'Tarjeta', 'Transferencia'].filter(
                method => !selectedMethods.includes(method)
              );

              return (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Monto"
                    className="w-1/2 border rounded p-2"
                    value={payment.amount}
                    onChange={(e) => {
                      const newPaymentMethods = [...paymentMethods];
                      newPaymentMethods[index].amount = e.target.value;
                      setPaymentMethods(newPaymentMethods);
                    }}
                    disabled={processingOrder}
                  />
                  <select
                    className="w-1/2 border rounded p-2"
                    value={payment.method}
                    onChange={(e) => {
                      const newPaymentMethods = [...paymentMethods];
                      newPaymentMethods[index].method = e.target.value;
                      setPaymentMethods(newPaymentMethods);
                    }}
                    disabled={processingOrder}
                  >
                    {availableMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {index === paymentMethods.length - 1 && paymentMethods.length < 3 && (
                    <button
                      className="bg-green-500 text-white p-2 rounded"
                      onClick={() => {
                        const availableMethod = availableMethods.find(
                          method => method !== payment.method
                        );
                        setPaymentMethods([
                          ...paymentMethods,
                          { amount: '', method: availableMethod || availableMethods[0] }
                        ]);
                      }}
                      disabled={processingOrder}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                  {paymentMethods.length > 1 && (
                    <button
                      className="bg-red-500 text-white p-2 rounded"
                      onClick={() => {
                        const newPaymentMethods = [...paymentMethods];
                        newPaymentMethods.splice(index, 1);
                        setPaymentMethods(newPaymentMethods);
                      }}
                      disabled={processingOrder}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {validateTotalAmount() && (
            <p className="text-red-500 text-sm mt-1">
              La suma de los montos debe ser igual al total de la venta
            </p>
          )}
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