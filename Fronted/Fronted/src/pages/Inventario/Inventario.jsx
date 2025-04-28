import React, { useState, useEffect } from "react";
import {
  Package,
  CircleAlert,
  List,
  Search,
  PlusCircle,
} from "lucide-react";
import { useOutletContext } from 'react-router-dom';
import "./Inventario.css";
import axios from "axios";

const Inventario = () => {
  // Obtenemos el contexto del AdminLayout
  const [darkMode, toggleDarkMode, activePage, setActivePage, empresaId] =
    useOutletContext();

  // Estado para productos, categorías y el inventario
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    nombre: "",
    precio_compra: 0,
    precio_venta: 0,
    descripcion: "",
    categoria_id: "",
    proveedor_id: "",
    stock: 0,
    cantidad_minima: 0,
    cantidad_maxima: 0,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuramos el título de la página
  useEffect(() => {
    setActivePage("Gestión de Inventario");
  }, [setActivePage]);

  // Fetch data al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categorías
        const catResponse = await axios.get(`/api/categorias/${empresaId}/`);
        setCategories(catResponse.data);

        // Fetch proveedores
        const provResponse = await axios.get(`/api/proveedores/${empresaId}/`);
        setProveedores(provResponse.data);

        // Fetch productos
        const prodResponse = await axios.get(`/api/productos/${empresaId}/`);
        setProducts(prodResponse.data);

        // Fetch inventarios
        const invResponse = await axios.get('/api/inventarios/');
        setInventarios(invResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchData();
    }
  }, [empresaId]);

  // Filtrado de productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "lowStock")
      return matchesSearch && product.stock < product.cantidad_minima;
    return matchesSearch && product.categoria.nombre === activeTab;
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    // Campos numéricos
    if (
      name === "stock" ||
      name === "cantidad_minima" ||
      name === "cantidad_maxima" ||
      name === "precio_compra" ||
      name === "precio_venta"
    ) {
      // Solo permitir que el input sea número o vacío (permitiendo escribir)
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setNewProduct({
          ...newProduct,
          [name]: value, // Guardamos como texto para no molestar al usuario mientras escribe
        });
      }
    }
    // Campos de relación (categoría y proveedor)
    else if (name === "categoria_id" || name === "proveedor_id") {
      setNewProduct({
        ...newProduct,
        [name]: value === "" ? "" : parseInt(value, 10)
      });
    }
    // Otros campos de texto
    else {
      setNewProduct({
        ...newProduct,
        [name]: value
      });
    }
  };
    

  // Guardar producto
  const handleSaveProduct = async () => {
    try {
      // Preparar los datos del producto, convirtiendo strings vacías a null
      const productData = {
        nombre: newProduct.nombre,
        precio_compra: newProduct.precio_compra,
        precio_venta: newProduct.precio_venta,
        descripcion: newProduct.descripcion,
        categoria_id: newProduct.categoria_id === "" ? null : newProduct.categoria_id,
        proveedor_id: newProduct.proveedor_id === "" ? null : newProduct.proveedor_id
      };
  
      let savedProduct;
  
      if (editingProduct) {
        // Actualizar producto existente
        const response = await axios.put(
          `/api/productos/${empresaId}/${editingProduct.id}/`, 
          productData
        );
        savedProduct = response.data;
        
        // Actualizar inventario
        await axios.put(`/api/inventarios/${savedProduct.inventario.id}/`, {
          producto: savedProduct.id,
          stock: newProduct.stock,
          cantidad_minima: newProduct.cantidad_minima,
          cantidad_maxima: newProduct.cantidad_maxima
        });
        
        // Actualizar lista de productos
        setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
      } else {
        // Crear nuevo producto
        const response = await axios.post(
          `/api/productos/${empresaId}/`, 
          productData
        );
        savedProduct = response.data;
        
        // Crear inventario para el producto
        await axios.post('/api/inventarios/', {
          producto: savedProduct.id,
          stock: newProduct.stock,
          cantidad_minima: newProduct.cantidad_minima,
          cantidad_maxima: newProduct.cantidad_maxima
        });
        
        // Añadir a la lista de productos
        setProducts([...products, savedProduct]);
      }
      
      // Cerrar modal y resetear estados
      setShowModal(false);
      setEditingProduct(null);
      setNewProduct({
        nombre: "",
        precio_compra: 0,
        precio_venta: 0,
        descripcion: "",
        categoria_id: "",
        proveedor_id: "",
        stock: 0,
        cantidad_minima: 0,
        cantidad_maxima: 0,
      });
      
      // Refrescar datos
      const prodResponse = await axios.get(`/api/productos/${empresaId}/`);
      setProducts(prodResponse.data);
      
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto. Por favor intente nuevamente.");
    }
  };

  // Editar producto
  const handleEditProduct = async (product) => {
    try {
      // Obtener datos del inventario de este producto
      const inventarioResponse = await axios.get(`/api/inventarios/${product.inventario?.id || ''}`);
      const inventario = inventarioResponse.data;
      
      setEditingProduct(product);
      setNewProduct({
        nombre: product.nombre,
        precio_compra: product.precio_compra,
        precio_venta: product.precio_venta,
        descripcion: product.descripcion || "",
        categoria_id: product.categoria.id,
        proveedor_id: product.proveedor.id,
        stock: inventario.stock,
        cantidad_minima: inventario.cantidad_minima,
        cantidad_maxima: inventario.cantidad_maxima
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Error al cargar los detalles del producto.");
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar este producto?")) {
      try {
        await axios.delete(`/api/productos/${empresaId}/${id}/`);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error al eliminar el producto.");
      }
    }
  };

  // Contar productos con stock bajo
  const lowStockCount = products.filter(p => p.stock < p.cantidad_minima).length;

  // Obtener categorías únicas
  useEffect(() => {
    if (categories.length > 0) {
      const uniqueCategories = [...new Set(categories.map(cat => cat.nombre))];
      setActiveTab("all");
    }
  }, [categories]);

  return (
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
            setNewProduct({
              nombre: "",
              precio_compra: 0,
              precio_venta: 0,
              descripcion: "",
              categoria_id: categories.length > 0 ? categories[0].id : "",
              proveedor_id: proveedores.length > 0 ? proveedores[0].id : "",
              stock: 0,
              cantidad_minima: 0,
              cantidad_maxima: 0,
            });
            setShowModal(true);
          }}
        >
          <PlusCircle size={16} />
          Nuevo Producto
        </button>
      </div>

      {/* Tabs */}
      <div className="inventory-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          Todos
        </button>
        <button
          className={activeTab === "lowStock" ? "active" : ""}
          onClick={() => setActiveTab("lowStock")}
        >
          Stock Bajo
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={activeTab === category.nombre ? "active" : ""}
            onClick={() => setActiveTab(category.nombre)}
          >
            {category.nombre}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="inventory-table-container">
        {loading ? (
          <p className="loading">Cargando productos...</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Stock Mínimo</th>
                <th>Precio de Venta</th>
                <th className="texto-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={
                      product.stock < product.cantidad_minima ? "low-stock" : ""
                    }
                  >
                    <td>{product.id}</td>
                    <td>{product.nombre}</td>
                    <td>{product.categoria.nombre}</td>
                    <td className="stock-cell">
                      {product.stock}
                      {product.stock < product.cantidad_minima && (
                        <CircleAlert
                          size={18}
                          color="currentColor"
                          className="alert-icon"
                        />
                      )}
                    </td>
                    <td>{product.inventario?.cantidad_minima || "N/A"}</td>
                    <td>${product.precio_venta.toFixed(2)}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditProduct(product)}
                      >
                        Editar
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input
                type="text"
                name="nombre"
                value={newProduct.nombre}
                onChange={handleInputChange}
                placeholder="Nombre"
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={newProduct.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción"
              ></textarea>
            </div>
            {/* Campo Categoría */}
            <div className="form-group">
              <label>Categoría</label>
              <select
                name="categoria_id"
                value={newProduct.categoria_id || ""}
                onChange={handleInputChange}
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Proveedor */}
            <div className="form-group">
              <label>Proveedor</label>
              <select
                name="proveedor_id"
                value={newProduct.proveedor_id || ""}
                onChange={handleInputChange}
              >
                <option value="">Sin proveedor</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Precio de Compra</label>
                <input
                  type="number"
                  name="precio_compra"
                  value={newProduct.precio_compra}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group half">
                <label>Precio de Venta</label>
                <input
                  type="number"
                  name="precio_venta"
                  value={newProduct.precio_venta}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Stock Actual</label>
                <input
                  type="number"
                  name="stock"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group half">
                <label>Stock Mínimo</label>
                <input
                  type="number"
                  name="cantidad_minima"
                  value={newProduct.cantidad_minima}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Stock Máximo</label>
              <input
                type="number"
                name="cantidad_maxima"
                value={newProduct.cantidad_maxima}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
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
  );
};

export default Inventario;