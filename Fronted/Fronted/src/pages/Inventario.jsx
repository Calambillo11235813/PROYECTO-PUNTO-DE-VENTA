import React, { useEffect, useState } from "react";
import { productoService } from "../services/productoService";
import { FaEdit, FaTrash, FaPlus, FaImage, FaUpload } from "react-icons/fa";
import cocacolaImg from '../assets/img/Cocacola.jpg'; // Imagen por defecto

const Inventario = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formProduct, setFormProduct] = useState({
    name: "",
    precio_compra: "",
    precio_venta: "",
    descripcion: "",
    usuario_id: "", 
    stock_inicial: "",
    cantidad_minima: "",
    cantidad_maxima: "",
    imagen: null,
    imagen_preview: null
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
    setFormProduct({
      ...formProduct,
      [name]: value
    });
  };

  // Manejador para archivos de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPG, PNG, GIF o WebP)');
        return;
      }
      
      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe ser menor a 2MB');
        return;
      }
      
      // Crear una URL para previsualizar la imagen
      const imageUrl = URL.createObjectURL(file);
      
      setFormProduct({
        ...formProduct,
        imagen: file,
        imagen_preview: imageUrl
      });
      
      console.log("Imagen seleccionada:", file.name);
    }
  };

  const openCreateModal = () => {
    const userId = localStorage.getItem("id");
    setEditMode(false);
    setFormProduct({
      name: "",
      precio_compra: "",
      precio_venta: "",
      descripcion: "",
      usuario_id: userId,
      stock_inicial: "",
      cantidad_minima: "",
      cantidad_maxima: "",
      imagen: null,
      imagen_preview: null
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setFormProduct({
      id: product.id,
      name: product.nombre,
      precio_compra: product.precio_compra,
      precio_venta: product.precio_venta,
      descripcion: product.descripcion || "",
      usuario_id: product.usuario.id,
      stock_inicial: product.stock,
      cantidad_minima: product.cantidad_minima || "",
      cantidad_maxima: product.cantidad_maxima || "",
      imagen: null,
      imagen_preview: product.imagen_url || null
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('nombre', formProduct.name);
      formData.append('precio_compra', formProduct.precio_compra);
      formData.append('precio_venta', formProduct.precio_venta);
      formData.append('descripcion', formProduct.descripcion || '');
      formData.append('stock_inicial', formProduct.stock_inicial);
      formData.append('cantidad_minima', formProduct.cantidad_minima || 0);
      formData.append('cantidad_maxima', formProduct.cantidad_maxima || 0);
      formData.append('usuario_id', formProduct.usuario_id);
      
      // Agregar imagen solo si hay una nueva seleccionada
      if (formProduct.imagen) {
        formData.append('imagen', formProduct.imagen);
      }
      
      if (editMode) {
        // Actualizar producto existente
        const result = await productoService.EditProduct({
          id: currentProduct.id,
          formData: formData
        });
        console.log("Producto actualizado con éxito:", result);
        
        // Actualizar la lista de productos
        const updatedProducts = await productoService.getAllProducts();
        setProducts(updatedProducts);
      } else {
        // Crear nuevo producto
        const result = await productoService.createProduct(formData);
        console.log("Producto creado con éxito:", result);
        
        // Actualizar la lista de productos
        const updatedProducts = await productoService.getAllProducts();
        setProducts(updatedProducts);
      }
      
      // Cerrar el modal y resetear el formulario
      setShowModal(false);
      setCurrentProduct(null);
      
      // Liberar la URL de objeto creada para la vista previa
      if (formProduct.imagen_preview && !formProduct.imagen_preview.includes('cloudinary')) {
        URL.revokeObjectURL(formProduct.imagen_preview);
      }
      
      // Resetear el formulario
      setFormProduct({
        name: "",
        precio_compra: "",
        precio_venta: "",
        descripcion: "",
        usuario_id: "",
        stock_inicial: "",
        cantidad_minima: "",
        cantidad_maxima: "",
        imagen: null,
        imagen_preview: null
      });
      
    } catch (error) {
      console.error(`Error al ${editMode ? 'actualizar' : 'crear'} el producto:`, error);
      alert(`Error al ${editMode ? 'actualizar' : 'crear'} el producto. Por favor intente nuevamente.`);
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
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
        >
          <FaPlus className="mr-2" /> Nuevo Producto
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
                <th className="px-4 py-2 border-b">Imagen</th>
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
                  <td className="px-4 py-2 border-b">
                    {product.imagen_url ? (
                      <img 
                        src={product.imagen_url} 
                        alt={product.nombre} 
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = cocacolaImg;
                        }}
                      />
                    ) : (
                      <img 
                        src={cocacolaImg}
                        alt={product.nombre}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 border-b">{product.nombre}</td>
                  <td className="px-4 py-2 border-b">{product.precio_compra}</td>
                  <td className="px-4 py-2 border-b">{product.precio_venta}</td>
                  <td className="px-4 py-2 border-b">{product.stock}</td>
                  <td className="px-4 py-2 border-b flex space-x-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                      title="Editar producto"
                    >
                      <FaEdit className="mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                      title="Eliminar producto"
                    >
                      <FaTrash className="mr-1" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Nuevo/Editar Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editMode ? "Editar Producto" : "Crear Nuevo Producto"}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  // Liberar URL objeto si existe
                  if (formProduct.imagen_preview && !formProduct.imagen_preview.includes('cloudinary')) {
                    URL.revokeObjectURL(formProduct.imagen_preview);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      value={formProduct.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2">Precio Compra</label>
                      <input
                        type="number"
                        step="0.01"
                        name="precio_compra"
                        value={formProduct.precio_compra}
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
                        value={formProduct.precio_venta}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formProduct.descripcion}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2">
                        {editMode ? "Stock Actual" : "Stock Inicial"}
                      </label>
                      <input
                        type="number"
                        name="stock_inicial"
                        value={formProduct.stock_inicial}
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
                        value={formProduct.cantidad_minima}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2">Cant. Máxima</label>
                      <input
                        type="number"
                        name="cantidad_maxima"
                        value={formProduct.cantidad_maxima}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Sección de imagen */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
                  {formProduct.imagen_preview ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative w-48 h-48">
                        <img
                          src={formProduct.imagen_preview}
                          alt="Vista previa"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormProduct({
                            ...formProduct,
                            imagen: null,
                            imagen_preview: null
                          })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <label
                        className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 flex items-center"
                      >
                        <FaUpload className="mr-2" />
                        Cambiar imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <FaImage className="w-16 h-16 text-gray-400" />
                      <p className="text-gray-500 text-center">
                        Arrastra y suelta una imagen aquí, o haz clic para seleccionar una imagen
                      </p>
                      <label
                        className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 flex items-center"
                      >
                        <FaUpload className="mr-2" />
                        Seleccionar imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    // Liberar URL objeto si existe
                    if (formProduct.imagen_preview && !formProduct.imagen_preview.includes('cloudinary')) {
                      URL.revokeObjectURL(formProduct.imagen_preview);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                    editMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submitting ? "Guardando..." : editMode ? "Actualizar Producto" : "Crear Producto"}
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