import React, { useEffect, useState } from "react";

const Inventario = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // Simular carga de datos
  useEffect(() => {
    setTimeout(() => {
      // Aquí reemplaza con tu llamada real a la API
      const fetchedData = []; // o algo como [{ id: 1, name: 'Producto A' }]
      setProducts(fetchedData);
      setLoading(false);
    }, 2000); // Simula 2 segundos de carga
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Inventario</h2>

      {loading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando productos...</span>
          <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg">
          No hay productos disponibles.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-600">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 border-b">ID</th>
                <th className="px-4 py-2 border-b">Nombre</th>
                <th className="px-4 py-2 border-b">Precio</th>
                <th className="px-4 py-2 border-b">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 border-b">{product.id}</td>
                  <td className="px-4 py-2 border-b">{product.name}</td>
                  <td className="px-4 py-2 border-b">{product.price}</td>
                  <td className="px-4 py-2 border-b">{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventario;
