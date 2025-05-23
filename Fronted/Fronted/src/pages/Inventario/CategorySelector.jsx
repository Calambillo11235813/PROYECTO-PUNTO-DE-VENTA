import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa'; // Añadir FaTrash
import categoriaService from '../../services/CategoriaService';

const CategorySelector = ({ isOpen, onClose, onSelectCategory, onCategoryCreated }) => {
  // Mantener los estados existentes
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Nuevo estado para la eliminación
  const [deleting, setDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  // Cargar categorías cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);
  
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriaService.getAllCategorias();
      setCategories(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('No se pudieron cargar las categorías. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      const newCategory = await categoriaService.createCategoria({ 
        nombre: newCategoryName.trim() 
      });
      
      // Actualizar la lista de categorías
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowNewCategoryForm(false);
      
      if (onCategoryCreated) {
        onCategoryCreated(newCategory);
      }
      
    } catch (err) {
      console.error('Error al crear categoría:', err);
      alert('No se pudo crear la categoría. Por favor, inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Añadir función para confirmar eliminación
  const handleDeleteClick = (e, category) => {
    e.stopPropagation(); // Evitar que se seleccione la categoría
    setCategoryToDelete(category);
  };
  
  // Función para ejecutar la eliminación
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setDeleting(true);
      await categoriaService.deleteCategoria(categoryToDelete.id);
      
      // Actualizar la lista eliminando la categoría
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      alert('No se pudo eliminar la categoría. Por favor, inténtelo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };
  
  // Cancelar la eliminación
  const cancelDelete = () => {
    setCategoryToDelete(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Seleccionar Categoría
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            {error}
            <button 
              onClick={loadCategories}
              className="block mx-auto mt-2 text-blue-500 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <button 
                onClick={() => onSelectCategory(null)}
                className="w-full text-left p-3 rounded border border-gray-200 hover:bg-blue-50 hover:text-gray-800 mb-2 flex items-center text-white bg-gray-800"
              >
                <span className="w-3 h-3 rounded-full bg-gray-400 mr-3"></span>
                <span>Todas las categorías</span>
              </button>
              
              {categories.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {categories.map(category => (
                    <button 
                      key={category.id}
                      onClick={() => onSelectCategory(category)}
                      className="w-full text-left p-3 rounded border border-gray-200 hover:bg-blue-50 hover:text-gray-800 mb-2 flex items-center text-white bg-gray-800 group"
                    >
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span>
                      <span className="flex-1">{category.nombre}</span>
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => handleDeleteClick(e, category)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        aria-label="Eliminar categoría"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No hay categorías disponibles
                </div>
              )}
            </div>
            
            {/* Modal de confirmación para eliminar */}
            {categoryToDelete && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 mb-3">
                    ¿Está seguro de eliminar la categoría <strong>"{categoryToDelete.nombre}"</strong>? 
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={cancelDelete}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                      disabled={deleting}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span> Eliminando...
                        </>
                      ) : (
                        <>
                          <FaTrash className="h-3 w-3 mr-2" /> Eliminar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Formulario para crear nueva categoría (mantener código existente) */}
            {!categoryToDelete && (
              <>
                {showNewCategoryForm ? (
                  <form onSubmit={handleCreateCategory} className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Crear nueva categoría
                    </h4>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de categoría"
                        className="flex-1 p-2 border rounded"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting || !newCategoryName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? "Creando..." : "Crear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-center mt-4 pt-4 border-t">
                    <button
                      onClick={() => setShowNewCategoryForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <FaPlus className="mr-2" /> Agregar categoría
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;