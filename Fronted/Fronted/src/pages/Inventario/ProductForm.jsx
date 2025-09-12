import React, { useState, useEffect } from 'react';
import { FaImage, FaUpload } from 'react-icons/fa';
import { productoService } from '../../services/productoService';
import categoriaService from '../../services/CategoriaService';

const ProductForm = ({ 
  isOpen, 
  onClose, 
  editMode = false, 
  currentProduct = null, 
  onProductSaved
}) => {
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
    imagen_preview: null,
    categoria_id: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Si estamos en modo edición, cargar los datos del producto
      if (editMode && currentProduct) {
        setFormProduct({
          id: currentProduct.id,
          name: currentProduct.nombre,
          precio_compra: currentProduct.precio_compra,
          precio_venta: currentProduct.precio_venta,
          descripcion: currentProduct.descripcion || "",
          usuario_id: currentProduct.usuario.id,
          stock_inicial: currentProduct.stock,
          cantidad_minima: currentProduct.cantidad_minima || "",
          cantidad_maxima: currentProduct.cantidad_maxima || "",
          imagen: null,
          imagen_preview: currentProduct.imagen_url || null,
          categoria_id: currentProduct.categoria_id || ""
        });
      } else {
        // En modo creación, inicializar con el ID de usuario actual
        const userId = localStorage.getItem("id");
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
          imagen_preview: null,
          categoria_id: ""
        });
      }

      // Cargar las categorías disponibles
      const loadCategories = async () => {
        try {
          setLoadingCategories(true);
          const categoriesData = await categoriaService.getAllCategorias();
          setCategories(categoriesData);
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        } finally {
          setLoadingCategories(false);
        }
      };
      
      loadCategories();
    }
  }, [isOpen, editMode, currentProduct]);

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

      // Agregar categoría si está seleccionada
      if (formProduct.categoria_id) {
        formData.append('categoria_id', formProduct.categoria_id);
      }
      
      let result;
      if (editMode) {
        // Actualizar producto existente
        result = await productoService.EditProduct({
          id: currentProduct.id,
          formData: formData
        });
        console.log("Producto actualizado con éxito:", result);
      } else {
        // Crear nuevo producto
        result = await productoService.createProduct(formData);
        console.log("Producto creado con éxito:", result);
      }
      
      // Notificar al componente padre que se ha guardado un producto
      onProductSaved();
      
      // Cerrar el modal y limpiar
      handleClose();
      
    } catch (error) {
      console.error(`Error al ${editMode ? 'actualizar' : 'crear'} el producto:`, error);
      alert(`Error al ${editMode ? 'actualizar' : 'crear'} el producto. Por favor intente nuevamente.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Liberar la URL de objeto creada para la vista previa
    if (formProduct.imagen_preview && !formProduct.imagen_preview.includes('cloudinary')) {
      URL.revokeObjectURL(formProduct.imagen_preview);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {editMode ? "Editar Producto" : "Crear Nuevo Producto"}
          </h3>
          <button 
            onClick={handleClose}
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

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
                <select
                  name="categoria_id"
                  value={formProduct.categoria_id || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Seleccionar categoría</option>
                  {loadingCategories ? (
                    <option disabled>Cargando categorías...</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))
                  )}
                </select>
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
              onClick={handleClose}
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
  );
};

export default ProductForm;