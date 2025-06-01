import React from 'react';
import cocacolaImg from '../assets/img/Cocacola.jpg'; // Asegurate que esta ruta sea correcta

const ProductCard = ({ product, onAddToCart }) => {
  // Usar imagen_url en lugar de imagen
  const imagenSrc = product.imagen_url ? product.imagen_url : cocacolaImg;

  return (
    <div className="bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow">
      <div className="w-full h-32 bg-gray-100 mb-3 flex items-center justify-center">
        <img 
          src={imagenSrc}
          alt={product.nombre}
          className="max-h-full max-w-full object-contain"
          // Agregar un manejador de errores para usar la imagen por defecto si falla la carga
          onError={(e) => {
            console.log("Error cargando imagen para:", product.nombre);
            e.target.onerror = null; // Prevenir bucles infinitos
            e.target.src = cocacolaImg;
          }}
        />
      </div>

      <h3 className="text-sm font-medium mb-1">{product.nombre}</h3>
      <p className="text-lg font-semibold text-green-600">
        ${typeof product.precio_venta === 'string' 
          ? parseFloat(product.precio_venta).toFixed(2) 
          : product.precio_venta.toFixed(2)}
      </p>
      <div className="text-xs text-gray-500">
        Stock: {product.stock}
      </div>

      <button 
        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm transition-colors"
        onClick={() => onAddToCart(product)}
        disabled={product.stock <= 0}
      >
        {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
      </button>
    </div>
  );
};

export default ProductCard;
