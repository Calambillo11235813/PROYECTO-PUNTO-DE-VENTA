import React, { useState, useEffect } from 'react';
import { FaBars, FaMoon, FaSun } from 'react-icons/fa';
import { Package, CircleAlert, List, Search, PlusCircle, Pencil, Trash, Sun, Moon } from 'lucide-react'; // Ajusta los íconos según tu proyecto
import Sidebar from '../../components/Sidebar/Sidebar';
import './Inventario.css';

// Datos de ejemplo para el inventario
const initialProducts = [
  { id: 1, name: 'Camisa Polo', sku: 'RP001', category: 'Ropa', stock: 25, minStock: 10, price: 29.99 },
  { id: 2, name: 'Pantalón Jeans', sku: 'RP002', category: 'Ropa', stock: 8, minStock: 10, price: 39.99 },
  { id: 3, name: 'Zapatos Deportivos', sku: 'CZ001', category: 'Calzado', stock: 15, minStock: 5, price: 59.99 },
  { id: 4, name: 'Reloj Inteligente', sku: 'AC001', category: 'Accesorios', stock: 3, minStock: 5, price: 89.99 },
  { id: 5, name: 'Laptop HP', sku: 'EL001', category: 'Electrónicos', stock: 12, minStock: 3, price: 699.99 },
];

const Inventario = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Inventario');
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    stock: 0,
    minStock: 0,
    price: 0,
  });
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    setCategories(uniqueCategories);
  }, [products]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    console.log('Navegar a:', page);
  };

  const handleLogout = () => {
    console.log('Cerrar sesión');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'lowStock') return matchesSearch && product.stock < product.minStock;
    return matchesSearch && product.category === activeTab;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'stock' || name === 'minStock' || name === 'price' ? parseFloat(value) : value;
    setNewProduct({ ...newProduct, [name]: parsedValue });
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      setProducts(products.map(p => (p.id === editingProduct.id ? { ...newProduct, id: p.id } : p)));
    } else {
      const id = Math.max(...products.map(p => p.id), 0) + 1;
      setProducts([...products, { ...newProduct, id }]);
    }
    setShowModal(false);
    setEditingProduct(null);
    setNewProduct({ name: '', sku: '', category: '', stock: 0, minStock: 0, price: 0 });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setShowModal(true);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const lowStockCount = products.filter(p => p.stock < p.minStock).length;

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar
        initialOpen={sidebarOpen}
        initialDarkMode={darkMode}
        onNavigation={handleNavigation}
        onDarkModeToggle={setDarkMode}
        onLogout={handleLogout}
        activePage={activePage}
      />

      <div className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        <div className="header">
          <div className="left">
            {!sidebarOpen && (
              <button className="menu-btn" onClick={toggleSidebar}>
                <FaBars />
              </button>
            )}
            <div className="inventory-title">
              <Package size={24} />
              <h1>Gestión de Inventario</h1>
            </div>
          </div>
          <div className="right">
            <div className="user-info">
              <img src="/api/placeholder/40/40" alt="User" className="user-avatar" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <div className="inventory-content">
          {/* Estadísticas */}
          <div className="inventory-stats">
            <div className="stat-card">
              <h3>Total de Productos</h3>
              <p>{products.length}</p>
              <div className="icon-container">
                <Package size={24} />
              </div>
            </div>
            <div className="stat-card alert">
              <h3>Stock Bajo</h3>
              <p>{lowStockCount}</p>
              <div className="icon-container">
                <CircleAlert size={24} />
              </div>
            </div>
            <div className="stat-card">
              <h3>Categorías</h3>
              <p>{categories.length}</p>
              <div className="icon-container">
                <List size={24} />
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="inventory-controls">
            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="add-product-btn"
              onClick={() => {
                setEditingProduct(null);
                setNewProduct({ name: '', sku: '', category: '', stock: 0, minStock: 0, price: 0 });
                setShowModal(true);
              }}
            >
              <PlusCircle size={16} />
              Nuevo Producto
            </button>
          </div>

          {/* Tabs */}
          <div className="inventory-tabs">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
              Todos
            </button>
            <button className={activeTab === 'lowStock' ? 'active' : ''} onClick={() => setActiveTab('lowStock')}>
              Stock Bajo
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={activeTab === category ? 'active' : ''}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Stock Mínimo</th>
                  <th>Precio</th>
                  <th className="texto-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                    <tr key={product.id} className={product.stock < product.minStock ? 'low-stock' : ''}>
                        <td>{product.sku}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td className="stock-cell">
                        {product.stock}
                        {product.stock < product.minStock && (
                            <CircleAlert size={18} color="currentColor" className="alert-icon" />
                        )}
                        </td>
                        <td>{product.minStock}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td className="actions-cell">
                        <button className="action-btn edit" onClick={() => handleEditProduct(product)}>
                            Editar
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteProduct(product.id)}>
                            Eliminar
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="7" className="no-data">No se encontraron productos</td>
                    </tr>
                )}
                </tbody>
            </table>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <div className="form-group">
                  <label>Nombre del Producto</label>
                  <input type="text" name="name" value={newProduct.name} onChange={handleInputChange} placeholder="Nombre" />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input type="text" name="sku" value={newProduct.sku} onChange={handleInputChange} placeholder="SKU" />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <input type="text" name="category" value={newProduct.category} onChange={handleInputChange} placeholder="Categoría" />
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Stock Actual</label>
                    <input type="number" name="stock" value={newProduct.stock} onChange={handleInputChange} min="0" />
                  </div>
                  <div className="form-group half">
                    <label>Stock Mínimo</label>
                    <input type="number" name="minStock" value={newProduct.minStock} onChange={handleInputChange} min="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Precio</label>
                  <input type="number" name="price" value={newProduct.price} onChange={handleInputChange} min="0" step="0.01" />
                </div>
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button className="save-btn" onClick={handleSaveProduct}>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Inventario;
