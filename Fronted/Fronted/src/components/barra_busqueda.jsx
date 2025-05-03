import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { productoService } from '../services/productoService';

const Barra_busqueda = ({ onSelectProduct, onSearchChange }) => {
  // Estados para productos y búsqueda
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Efecto para detectar clics fuera del área de búsqueda
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  // Cargar productos cuando el componente se monte
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productoService.getAllProducts();
        
        // Validar que los datos sean un array
        if (Array.isArray(data)) {
          // Formatear los datos para asegurarnos de que los tipos sean correctos
          const formattedData = data.map(product => ({
            ...product,
            precio_venta: Number(product.precio_venta),
            precio_compra: Number(product.precio_compra),
            stock_inicial: Number(product.stock_inicial)
          }));
          
          setProducts(formattedData);
          setError(null);
        } else {
          console.error("Datos de productos no válidos:", data);
          setError("Formato de datos incorrecto");
        }
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Función para manejar la búsqueda
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Notificar al componente padre sobre el cambio en la búsqueda
    if (onSearchChange) {
      onSearchChange(query);
    }
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Filtrar productos que coincidan con la consulta
    const filteredProducts = products
      .filter(product => 
        product.nombre?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limitar a los 5 primeros resultados
    
    setSearchResults(filteredProducts);
    setShowSearchResults(true);
  };

  // Función para seleccionar un producto desde la búsqueda
  const selectProductFromSearch = (product) => {
    // No limpiamos la búsqueda, solo actualizamos la consulta
    // con el nombre del producto seleccionado
    setSearchQuery(product.nombre);
    
    // Ocultamos los resultados de búsqueda pero mantenemos la consulta
    setShowSearchResults(false);
    
    // Notificamos el cambio al componente padre para filtrar los productos
    if (onSearchChange) {
      onSearchChange(product.nombre);
    }
  };

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Notificar al componente padre que se ha limpiado la búsqueda
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div className="barra-busqueda-container">
      <div ref={searchRef} className="relative w-full">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-gray-100">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => searchQuery.trim() !== '' && setShowSearchResults(true)}
            className="w-full px-3 py-2 outline-none"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="px-3 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {searchResults.map(product => (
              <div 
                key={product.id}
                onClick={() => selectProductFromSearch(product)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{product.nombre}</div>
                  <div className="text-sm text-gray-500">Stock: {Number(product.stock_inicial)}</div>
                </div>
                <div className="font-semibold">${Number(product.precio_venta).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
        
        {showSearchResults && searchQuery && searchResults.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm">Cargando...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative mt-2 text-sm">
          <strong className="font-bold">Error:</strong>
          <span className="ml-1">{error}</span>
        </div>
      )}
    </div>
  );
};

export default Barra_busqueda;