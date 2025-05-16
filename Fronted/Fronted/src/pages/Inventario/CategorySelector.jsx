import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import categoriaService from '../../services/CategoriaService';

const CategorySelector = ({ isOpen, onClose, onSelectCategory, onCategoryCreated }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
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
                      className="w-full text-left p-3 rounded border border-gray-200 hover:bg-blue-50 hover:text-gray-800 mb-2 flex items-center text-white bg-gray-800"
                    >
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span>
                      <span>{category.nombre}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No hay categorías disponibles
                </div>
              )}
            </div>
            
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
      </div>
    </div>
  );
};

export default CategorySelector;