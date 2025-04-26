import React, { useState } from 'react';
import './Products.css'; // Crea también este archivo con los estilos

const Products = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Laptop HP 15"', sku: 'LP001', price: 899.99, stock: 24, category: 'Computadoras' },
    { id: 2, name: 'Monitor Samsung 24"', sku: 'MN002', price: 249.99, stock: 15, category: 'Monitores' },
    { id: 3, name: 'Mouse Logitech', sku: 'MS003', price: 29.99, stock: 42, category: 'Accesorios' },
    { id: 4, name: 'Teclado Mecánico', sku: 'KB004', price: 79.99, stock: 18, category: 'Teclados' },
    { id: 5, name: 'Disco Duro SSD 500GB', sku: 'SSD005', price: 89.99, stock: 30, category: 'Almacenamiento' },
  ]);

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Gestión de Productos</h1>
        <button className="add-product-btn">
          <i className="fas fa-plus"></i> Nuevo Producto
        </button>
      </div>

      <div className="products-filters">
        <div className="search-box">
          <input type="text" placeholder="Buscar productos..." />
          <button><i className="fas fa-search"></i></button>
        </div>
        <div className="filter-options">
          <select defaultValue="">
            <option value="">Todas las categorías</option>
            <option value="Computadoras">Computadoras</option>
            <option value="Monitores">Monitores</option>
            <option value="Accesorios">Accesorios</option>
            <option value="Teclados">Teclados</option>
            <option value="Almacenamiento">Almacenamiento</option>
          </select>
          <select defaultValue="all">
            <option value="all">Todos los productos</option>
            <option value="inStock">En stock</option>
            <option value="lowStock">Stock bajo</option>
            <option value="outOfStock">Sin stock</option>
          </select>
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>${product.price.toFixed(2)}</td>
                <td className={product.stock < 10 ? 'low-stock' : ''}>{product.stock}</td>
                <td>{product.category}</td>
                <td className="actions">
                  <button className="edit-btn" title="Editar">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="delete-btn" title="Eliminar">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="products-pagination">
        <button disabled>&lt; Anterior</button>
        <span>Página 1 de 1</span>
        <button disabled>Siguiente &gt;</button>
      </div>
    </div>
  );
};

export default Products;