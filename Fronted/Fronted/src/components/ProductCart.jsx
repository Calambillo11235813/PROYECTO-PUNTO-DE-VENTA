import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow">
      <div className="w-full h-32 bg-gray-100 mb-3 flex items-center justify-center">
        {product.imagen ? (
          <img 
            src={product.imagen} 
            alt={product.nombre} 
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-200"></div>
        )}
      </div>
      
      <h3 className="text-sm font-medium mb-1">{product.nombre}</h3>
      <p className="text-lg font-semibold text-green-600">${product.precio_venta.toFixed(2)}</p>
      <div className="text-xs text-gray-500">
        Stock: {product.stock}
      </div>
      
      <button 
        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm transition-colors"
        onClick={() => onAddToCart(product)}
      >
        Agregar al carrito
      </button>
    </div>
  );
};

export default ProductCard;