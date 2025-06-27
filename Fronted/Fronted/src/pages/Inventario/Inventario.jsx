import React, { useEffect, useState } from "react";
import { productoService } from "../../services/productoService";
import { FaEdit, FaTrash, FaPlus, FaFilter, FaTags, FaTimes, FaStore } from "react-icons/fa";
import cocacolaImg from '../../assets/img/Cocacola.jpg'; // Imagen por defecto
import ProductForm from "./ProductForm";
import DeleteConfirmation from "./DeleteConfirmation";
import CategorySelector from "./CategorySelector"; 
import sucursalService from '../../services/SucursalService';

const Inventario = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Nuevos estados para sucursales
  const [showSucursalSelector, setShowSucursalSelector] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Obtener el ID del usuario y la sucursal actual del localStorage
  const userId = localStorage.getItem('id');
  const currentSucursalId = localStorage.getItem('sucursal_actual_id');

  const fetchSucursales = async () => {
    try {
      setLoadingSucursales(true);
      const data = await sucursalService.getSucursalesByUsuario(userId);
      setSucursales(data);
      
      // Establecer la sucursal seleccionada basada en localStorage
      if (currentSucursalId) {
        const current = data.find(suc => suc.id == currentSucursalId);
        if (current) {
          setSelectedSucursal(current);
        }
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setLoadingSucursales(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Si hay una sucursal seleccionada, obtener productos específicos de esa sucursal
      if (selectedSucursal) {
        console.log(`🔍 Buscando productos específicos para la sucursal: ${selectedSucursal.id}`);
        const fetchedData = await productoService.getProductosBySucursal(userId, selectedSucursal.id);
        console.log('📋 Productos obtenidos para la sucursal:', fetchedData);
        setProducts(fetchedData);
        applyFilters(fetchedData, selectedCategory);
      } else if (currentSucursalId) {
        // Usar la sucursal actual del localStorage
        console.log(`🔍 Usando sucursal actual del localStorage: ${currentSucursalId}`);
        const fetchedData = await productoService.getProductosBySucursal(userId, currentSucursalId);
        console.log('📋 Productos obtenidos para la sucursal actual:', fetchedData);
        setProducts(fetchedData);
        applyFilters(fetchedData, selectedCategory);
      } else {
        // Cargar todos los productos (comportamiento original)
        console.log('🔍 Cargando todos los productos (sin filtro de sucursal)');
        const fetchedData = await productoService.getAllProducts();
        setProducts(fetchedData);
        applyFilters(fetchedData, selectedCategory);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (productsArray, category) => {
    if (!category) {
      setFilteredProducts(productsArray);
    } else {
      setFilteredProducts(
        productsArray.filter(
          (product) => product.categoria && product.categoria.id === category.id
        )
      );
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, [userId]);

  useEffect(() => {
    fetchProducts();
  }, [selectedSucursal, currentSucursalId]);

  useEffect(() => {
    applyFilters(products, selectedCategory);
  }, [selectedCategory, products]);

  const handleProductSaved = () => {
    // Refrescar la lista de productos
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setShowModal(true);
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
      const updatedProducts = products.filter(p => p.id !== productToDelete.id);
      setProducts(updatedProducts);
      applyFilters(updatedProducts, selectedCategory);
      
      setDeleteConfirmModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      alert("Error al eliminar el producto. Por favor intente nuevamente.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };
  
  // Nuevo manejador para seleccionar sucursal
  const handleSucursalChange = (sucursal) => {
    setSelectedSucursal(sucursal);
    localStorage.setItem('sucursal_actual_id', sucursal.id);
    localStorage.setItem('sucursal_actual_nombre', sucursal.nombre);
    setShowSucursalSelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const producto = {
      // ...otros campos...
      stock_minimo,
      stock_maximo,
      // ...otros campos...
    };

    console.log("Producto a guardar:", producto); // <-- Aquí ves los valores

    await productoService.saveProduct(producto);
    // ...resto del código...
  };

  return (
    <div style={{ backgroundColor: "var(--bg-tertiary)" }}className="p-6 dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        
        <h2 className="text-2xl font-bold title-icon dark:text-gray">Inventario</h2>
        <div className="flex space-x-2">
          {/* Indicador de sucursal actual */}
          <button 
            onClick={() => setShowSucursalSelector(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <FaStore className="mr-2" /> 
            {selectedSucursal ? selectedSucursal.nombre : "Seleccionar Sucursal"}
          </button>
          
          {selectedCategory && (
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center">
              <span className="mr-1">Filtrando por:</span>
              <span className="font-semibold">{selectedCategory.nombre}</span>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Quitar filtro"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FaTags className="mr-2" /> Categorías
          </button>
          
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FaPlus className="mr-2" /> Nuevo Producto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando productos...</span>
          <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg py-8">
          {selectedSucursal 
            ? `No hay productos en la sucursal "${selectedSucursal.nombre}"`
            : "No hay productos disponibles."}
          
          {selectedCategory && 
            <div>con la categoría "{selectedCategory.nombre}".</div>
          }
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Tabla existente */}
          <table className="min-w-full border border-gray-200 dark:border-gray-600 text-center">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 border-b text-center">ID</th>
                <th className="px-4 py-2 border-b text-center">Imagen</th>
                <th className="px-4 py-2 border-b text-center">Nombre</th>
                <th className="px-4 py-2 border-b text-center">Categoría</th>
                <th className="px-4 py-2 border-b text-center">Precio compra</th>
                <th className="px-4 py-2 border-b text-center">Precio venta</th>
                <th className="px-4 py-2 border-b text-center">Stock</th>
                <th className="px-4 py-2 border-b text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 border-b text-center">{product.id}</td>
                  <td className="px-4 py-2 border-b text-center">
                    <div className="flex justify-center">
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
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b text-center">{product.nombre}</td>
                  <td className="px-4 py-2 border-b text-center">
                    {product.categoria ? (
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {product.categoria.nombre}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin categoría</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border-b text-center">{product.precio_compra}</td>
                  <td className="px-4 py-2 border-b text-center">{product.precio_venta}</td>
                  <td className="px-4 py-2 border-b text-center">{product.stock}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex justify-center space-x-2">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de selección de sucursal */}
      {showSucursalSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={{ backgroundColor: "var(--bg-tertiary)" }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Seleccionar Sucursal</h3>
              <button 
                onClick={() => setShowSucursalSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {loadingSucursales ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {sucursales.map(sucursal => (
                  <button
                    key={sucursal.id}
                    onClick={() => handleSucursalChange(sucursal)}
                    className={`w-full text-left p-4 rounded mb-2 flex items-center ${
                      selectedSucursal && selectedSucursal.id === sucursal.id
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <FaStore className="mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">{sucursal.nombre}</div>
                      <div className="text-sm text-gray-500">{sucursal.direccion}</div>
                    </div>
                    {selectedSucursal && selectedSucursal.id === sucursal.id && (
                      <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Actual
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Componentes modales existentes */}
      <ProductForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editMode={editMode}
        currentProduct={currentProduct}
        onProductSaved={handleProductSaved}
      />

      <DeleteConfirmation
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        productName={productToDelete?.nombre || ""}
        isDeleting={deleting}
      />

      <CategorySelector
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelectCategory={handleCategorySelect}
        onCategoryCreated={() => fetchProducts()}
      />
    </div>
  );
};

export default Inventario;