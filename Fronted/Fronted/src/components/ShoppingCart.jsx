import React, { useState } from 'react';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, Loader, FileText } from 'lucide-react';
import { pedidoService } from '../services/pedidoService';

const ShoppingCart = ({ 
  cartItems, 
  cliente, 
  setCliente, 
  total,
  paymentMethods,
  setPaymentMethods,
  onFinalizarVenta, 
  onRemoveItem, 
  onUpdateQuantity,
  processingOrder = false,
  pedidos = [],
  onDeletePedido
}) => {
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' o 'history'
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidoTransactions, setPedidoTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const validateTotalAmount = () => {
    const sum = paymentMethods.reduce((acc, payment) => {
      return acc + (Number(payment.amount) || 0);
    }, 0);
    return Math.abs(sum - total) > 0.01;
  };

  const handleViewPedidoDetails = async (pedidoId) => {
    try {
      setLoadingTransactions(true);
      const pedidoDetails = await pedidoService.getPedidoById(pedidoId);
      setSelectedPedido(pedidoDetails);
      
      // Ahora las transacciones vienen incluidas en los detalles del pedido
      setPedidoTransactions(pedidoDetails.transacciones || []);
    } catch (error) {
      console.error("Error al cargar detalles del pedido:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDeleteTransaction = async (pedidoId, transactionId) => {
    try {
      await pedidoService.deleteTransaction(pedidoId, transactionId);
      // Actualizar las transacciones tras eliminar
      const pedidoDetails = await pedidoService.getPedidoById(pedidoId);
      setPedidoTransactions(pedidoDetails.transacciones || []);
      setSelectedPedido(pedidoDetails);
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
    }
  };

  // Estado para los pedidos
  const getEstadoLabel = (estadoId) => {
    const estados = {
      1: "Completado",
      2: "Pendiente",
      3: "Cancelado"
    };
    return estados[estadoId] || "Desconocido";
  };

  return (
    <div className="w-full h-full bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">
          {activeTab === 'cart' ? 'Carrito de Compras' : 'Historial de Pedidos'}
        </h2>
        <div className="flex">
          <button 
            className={`px-3 py-1 rounded-l ${activeTab === 'cart' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('cart')}
          >
            Carrito
          </button>
          <button 
            className={`px-3 py-1 rounded-r ${activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('history')}
          >
            Historial
          </button>
        </div>
      </div>
      
      {activeTab === 'cart' ? (
        <>
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
                        disabled={processingOrder}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border rounded">
                        <button 
                          className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1 || processingOrder}
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
                          disabled={processingOrder}
                        />
                        <button 
                          className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                          title="Aumentar cantidad"
                          disabled={processingOrder}
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
              
              <div className="mb-2">
                <label className="block mb-1">Cliente:</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  disabled={processingOrder}
                />
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
              {validateTotalAmount() && paymentMethods[0].amount && (
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
        </>
      ) : (
        // Pestaña de historial de pedidos
        <div className="flex-1 overflow-y-auto p-4">
          {selectedPedido ? (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Detalles del Pedido #{selectedPedido.id}</h3>
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => setSelectedPedido(null)}
                >
                  Volver al historial
                </button>
              </div>
              
              <div className="mb-4">
                <p><strong>Fecha:</strong> {new Date(selectedPedido.fecha).toLocaleDateString()}</p>
                <p><strong>Total:</strong> ${Number(selectedPedido.total).toFixed(2)}</p>
                <p><strong>Estado:</strong> {selectedPedido.estado ? getEstadoLabel(selectedPedido.estado) : "Sin estado"}</p>
              </div>
              
              <h4 className="font-medium mb-2">Productos:</h4>
              <div className="mb-4 border rounded-lg">
                {selectedPedido.detalles && selectedPedido.detalles.map(detalle => (
                  <div key={detalle.id} className="p-2 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <span>{detalle.producto} x {detalle.cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <h4 className="font-medium mb-2">Transacciones:</h4>
              {loadingTransactions ? (
                <div className="flex justify-center p-4">
                  <Loader className="animate-spin h-5 w-5" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  {pedidoTransactions && pedidoTransactions.length > 0 ? (
                    pedidoTransactions.map(transaction => (
                      <div key={transaction.id} className="p-2 border-b last:border-b-0 flex justify-between items-center">
                        <span>{transaction.tipo_pago}: ${Number(transaction.monto).toFixed(2)}</span>
                        <button 
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                          onClick={() => handleDeleteTransaction(selectedPedido.id, transaction.id)}
                          title="Eliminar transacción"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="p-2 text-gray-500">No hay transacciones registradas</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este pedido?')) {
                      onDeletePedido(selectedPedido.id);
                      setSelectedPedido(null);
                    }
                  }}
                >
                  Eliminar Pedido
                </button>
              </div>
            </div>
          ) : (
            <>
              {pedidos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <FileText className="h-16 w-16 mb-3" />
                  <p>No hay pedidos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pedidos.map(pedido => (
                    <div key={pedido.id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer"
                      onClick={() => handleViewPedidoDetails(pedido.id)}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Pedido #{pedido.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.estado === 1 ? 'bg-green-100 text-green-800' : 
                          pedido.estado === 2 ? 'bg-yellow-100 text-yellow-800' : 
                          pedido.estado === 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                        }`}>
                          {pedido.estado ? getEstadoLabel(pedido.estado) : 'Sin estado'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>{new Date(pedido.fecha).toLocaleDateString()}</p>
                        <p className="font-semibold">${Number(pedido.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;