import React, { useEffect, useState } from "react";
import { productoService } from "../services/productoService";

const Inventario = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    precio_compra: "",
    precio_venta: "",
    descripcion: "",
    usuario_id: "", // Asumiendo que este es el ID del usuario actual
    stock_inicial: "",
    cantidad_minima: "",
    cantidad_maxima: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedData = await productoService.getAllProducts();
        setProducts(fetchedData);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    const userid = localStorage.getItem("id");
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const result = await productoService.createProduct(newProduct);
      console.log("Producto creado con éxito:", result);
      
      // Actualizar la lista de productos
      const updatedProducts = await productoService.getAllProducts();
      setProducts(updatedProducts);
      
      // Cerrar el modal y resetear el formulario
      setShowModal(false);
      setNewProduct({
        name: "",
        precio_compra: "",
        precio_venta: "",
        descripcion: "",
        usuario_id: userid,
        stock_inicial: "",
        cantidad_minima: "",
        cantidad_maxima: ""
      });
    } catch (error) {
      console.error("Error al crear el producto:", error);
      alert("Error al crear el producto. Por favor intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setDeleting(true);
    try {
      await productoService.deleteProduct({ id: productToDelete.id });
      console.log("Producto eliminado con éxito:", productToDelete.id);
      
      // Actualizar la lista de productos - eliminar localmente para evitar otra llamada API
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setDeleteConfirmModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      alert("Error al eliminar el producto. Por favor intente nuevamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray">Inventario</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Nuevo Producto
        </button>
      </div>

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
                <th className="px-4 py-2 border-b">Precio compra</th>
                <th className="px-4 py-2 border-b">Precio venta</th>
                <th className="px-4 py-2 border-b">Stock</th>
                <th className="px-4 py-2 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 border-b">{product.id}</td>
                  <td className="px-4 py-2 border-b">{product.nombre}</td>
                  <td className="px-4 py-2 border-b">{product.precio_compra}</td>
                  <td className="px-4 py-2 border-b">{product.precio_venta}</td>
                  <td className="px-4 py-2 border-b">{product.stock}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      title="Eliminar producto"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Nuevo Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Crear Nuevo Producto</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_compra"
                    value={newProduct.precio_compra}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Precio Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_venta"
                    value={newProduct.precio_venta}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  value={newProduct.descripcion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Stock Inicial</label>
                  <input
                    type="number"
                    name="stock_inicial"
                    value={newProduct.stock_inicial}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Cant. Mínima</label>
                  <input
                    type="number"
                    name="cantidad_minima"
                    value={newProduct.cantidad_minima}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Cant. Máxima</label>
                  <input
                    type="number"
                    name="cantidad_maxima"
                    value={newProduct.cantidad_maxima}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="mb-6 text-center">
              <svg className="mx-auto mb-4 w-14 h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Confirmar eliminación</h3>
              <p className="text-gray-600 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar el producto "{productToDelete.nombre}"? Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;