// lib/models/product.dart

/// Modelo que representa un Producto del inventario.
class Product {
  final String id;
  final String name;
  final int stock;

  Product({required this.id, required this.name, required this.stock});
}
