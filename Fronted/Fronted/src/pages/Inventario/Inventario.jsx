import React, { useState, useEffect } from 'react';
import { productoService } from '../../services/productoService.js';
import '../../../src/global.css';

const initialProductState = {
  id: '',
  name: '',           // Cambiado de nombre a name para coincidir con createUser
  precio_compra: '',  // Añadido para coincidir con createUser
  precio_venta: '',
  descripcion: '',    // Añadido para coincidir con createUser
  empresa_id: 1,      // Valor por defecto para empresa_id
};

const Inventario = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productForm, setProductForm] = useState(initialProductState);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productoService.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError("No se pudieron cargar los productos. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setProductForm(initialProductState);
    setIsEditing(false);
  };

  const handleSaveProduct = async () => {
    try {
      if (isEditing) {
        // Para la edición, necesitarías implementar un método updateUser en el servicio
        alert("La funcionalidad de edición no está implementada aún.");
      } else {
        // Usar createUser para crear un nuevo producto
        const newUser = await productoService.createProduct(productForm);
        console.log("Nuevo producto creado:", newUser);
        // Actualizar la lista de productos después de crear uno nuevo
        fetchProducts(); // Refetch todos los productos para asegurar datos actualizados
      }
      setShowModal(false); // Cerrar el modal
      resetForm(); // Resetear el formulario
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert("Ocurrió un error al guardar el producto.");
    }
  };

  const handleEditProduct = (product) => {
    // Adaptar los campos del producto para el formulario
    const formattedProduct = {
      id: product.id,
      name: product.nombre,
      precio_compra: product.precio_compra,
      precio_venta: product.precio_venta,
      descripcion: product.descripcion,
      empresa_id: product.empresa_id || 1
    };
    setProductForm(formattedProduct);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Desea eliminar este producto?')) return;
    try {
      // Aquí necesitarías implementar un método deleteUser en el servicio
      alert("La funcionalidad de eliminación no está implementada aún.");
      // Después de eliminar, actualizar la lista
      fetchProducts();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      alert("No se pudo eliminar el producto.");
    }
  };

  const openNewProductModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchProducts}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventario de Productos</h1>
        <button
          onClick={openNewProductModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nuevo Producto
        </button>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg bg-white">
        {products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay productos disponibles.
          </div>
        ) : (
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Precio Venta</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Precio Compra</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{product.id}</td>
                  <td className="px-6 py-3 text-sm">{product.nombre}</td>
                  <td className="px-6 py-3 text-sm">{parseFloat(product.precio_venta).toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm">{parseFloat(product.precio_compra).toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm">{product.descripcion}</td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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

      {/* Modal actualizado para usar los campos del servicio createUser */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <div className="space-y-4">
              {/* Campo para el nombre */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del producto"
                />
              </div>
              
              {/* Campo para el precio de compra */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700">
                  Precio de Compra
                </label>
                <input
                  type="number"
                  name="precio_compra"
                  value={productForm.precio_compra}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Precio de compra"
                />
              </div>
              
              {/* Campo para el precio de venta */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700">
                  Precio de Venta
                </label>
                <input
                  type="number"
                  name="precio_venta"
                  value={productForm.precio_venta}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Precio de venta"
                />
              </div>
              
              {/* Campo para la descripción */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={productForm.descripcion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del producto"
                  rows="3"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;