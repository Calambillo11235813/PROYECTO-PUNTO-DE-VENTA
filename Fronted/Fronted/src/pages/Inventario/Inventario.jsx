import React, { useEffect, useState, useCallback } from "react";
import { productoService } from "../../services/productoService";
import { FaEdit, FaTrash, FaPlus, FaFilter, FaTags, FaTimes, FaLock } from "react-icons/fa";
import cocacolaImg from '../../assets/img/Cocacola.jpg'; // Imagen por defecto
import ProductForm from "./ProductForm";
import DeleteConfirmation from "./DeleteConfirmation";
import CategorySelector from "./CategorySelector";
import permisoService from "../../services/permisoService";

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
  const [userPermisos, setUserPermisos] = useState([]);
  const [permisosLoading, setPermisosLoading] = useState(true);

  // Cargar los permisos del usuario
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        setPermisosLoading(true);
        
        // Verificar si es administrador
        const userType = localStorage.getItem('user_type');
        if (userType === 'usuario') {
          // Administrador tiene todos los permisos
          setUserPermisos([
            'ver_inventarios', 
            'agregar_inventario', 
            'editar_inventario', 
            'eliminar_inventario',
            'agregar_categoria'
          ]);
          setPermisosLoading(false);
          return;
        }
        
        // Para otros usuarios, cargar sus permisos específicos
        const empleadoId = localStorage.getItem('id');
        if (!empleadoId) {
          console.warn("No se encontró ID de empleado en localStorage");
          setPermisosLoading(false);
          return;
        }
        
        const permisosData = await permisoService.getPermisosEmpleado(empleadoId);
        
        // Convertir el resultado a un array de nombres de permisos
        if (Array.isArray(permisosData)) {
          setUserPermisos(permisosData.map(p => p.nombre));
        } else {
          console.warn("Formato de permisos inesperado:", permisosData);
          setUserPermisos([]);
        }
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        setUserPermisos([]);
      } finally {
        setPermisosLoading(false);
      }
    };
    
    cargarPermisos();
  }, []);

  // Verificar si el usuario tiene un permiso específico
  const tienePermiso = useCallback((permisoRequerido) => {
    // Si el usuario es de tipo "usuario" (administrador general), tiene acceso a todo
    const userType = localStorage.getItem('user_type');
    if (userType === 'usuario') return true;
    
    // Para otros tipos de usuarios, verificar permisos específicos
    if (!permisoRequerido) return true; // Si no se requiere permiso específico
    
    // Si es usuario admin (puedes identificarlo por un permiso especial)
    if (userPermisos.includes('admin_acceso_total')) return true;
    
    // Verificar si el usuario tiene el permiso específico
    return userPermisos.includes(permisoRequerido);
  }, [userPermisos]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const fetchedData = await productoService.getAllProducts();
      setProducts(fetchedData);
      applyFilters(fetchedData, selectedCategory);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((productsArray, category) => {
    if (!category) {
      setFilteredProducts(productsArray);
    } else {
      setFilteredProducts(
        productsArray.filter(
          (product) => product.categoria && product.categoria.id === category.id
        )
      );
    }
  }, []);

  useEffect(() => {
    // Solo cargar productos si el usuario tiene permiso
    if (tienePermiso('ver_inventarios')) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [tienePermiso]);

  useEffect(() => {
    applyFilters(products, selectedCategory);
  }, [selectedCategory, products, applyFilters]);

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

  // Si el usuario no tiene permiso para ver inventarios, mostrar mensaje de acceso restringido
  if (!permisosLoading && !tienePermiso('ver_inventarios')) {
    return (
      <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
        <div className="text-center text-red-600 py-8">
          <FaLock className="mx-auto text-6xl mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permiso para acceder al inventario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-white-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray">Inventario</h2>
        <div className="flex space-x-2">
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
          
          {/* Mostrar botón de categorías solo si tiene permiso */}
          {tienePermiso('agregar_categoria') && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaTags className="mr-2" /> Categorías
            </button>
          )}
          
          {/* Mostrar botón de nuevo producto solo si tiene permiso */}
          {tienePermiso('agregar_inventario') && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" /> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {loading || permisosLoading ? (
        <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
          <span className="text-lg">Cargando productos...</span>
          <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 text-lg">
          {selectedCategory 
            ? `No hay productos en la categoría "${selectedCategory.nombre}".`
            : "No hay productos disponibles."}
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                
                {/* Mostrar columna de acciones solo si tiene permisos de edición/eliminación */}
                {(tienePermiso('editar_inventario') || tienePermiso('eliminar_inventario')) && (
                  <th className="px-4 py-2 border-b text-center">Acciones</th>
                )}
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
                  
                  {/* Mostrar acciones solo si tiene permisos */}
                  {(tienePermiso('editar_inventario') || tienePermiso('eliminar_inventario')) && (
                    <td className="px-4 py-2 border-b">
                      <div className="flex justify-center space-x-2">
                        {/* Botón de editar solo si tiene permiso */}
                        {tienePermiso('editar_inventario') && (
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                            title="Editar producto"
                          >
                            <FaEdit className="mr-1" /> Editar
                          </button>
                        )}
                        
                        {/* Botón de eliminar solo si tiene permiso */}
                        {tienePermiso('eliminar_inventario') && (
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                            title="Eliminar producto"
                          >
                            <FaTrash className="mr-1" /> Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Componente modular para añadir/editar producto - Solo mostrar si tiene permiso */}
      {((editMode && tienePermiso('editar_inventario')) || (!editMode && tienePermiso('agregar_inventario'))) && (
        <ProductForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editMode={editMode}
          currentProduct={currentProduct}
          onProductSaved={handleProductSaved}
        />
      )}

      {/* Componente modular para confirmar eliminación - Solo mostrar si tiene permiso */}
      {tienePermiso('eliminar_inventario') && (
        <DeleteConfirmation
          isOpen={deleteConfirmModal}
          onClose={() => setDeleteConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          productName={productToDelete?.nombre || ""}
          isDeleting={deleting}
        />
      )}

      {/* Componente para seleccionar categorías - Solo mostrar si tiene permiso */}
      {tienePermiso('agregar_categoria') && (
        <CategorySelector
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSelectCategory={handleCategorySelect}
          onCategoryCreated={() => fetchProducts()}
        />
      )}
    </div>
  );
};

export default Inventario;