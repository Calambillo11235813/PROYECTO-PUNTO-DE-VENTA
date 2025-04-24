// lib/widgets/inventory_widget.dart
import 'package:flutter/material.dart';
import '../models/product.dart';

/// Widget que muestra una lista de productos utilizando el modelo [Product].
class InventoryWidget extends StatelessWidget {
  const InventoryWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // Lista de productos de ejemplo.
    final List<Product> products = [
      Product(id: '1', name: 'Producto A', stock: 50),
      Product(id: '2', name: 'Producto B', stock: 20),
      Product(id: '3', name: 'Producto C', stock: 0),
      Product(id: '4', name: 'Producto D', stock: 15),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(8.0),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
          child: ListTile(
            leading: const Icon(Icons.inventory),
            title: Text(product.name),
            subtitle: Text("Stock: ${product.stock}"),
            onTap: () {
              // Aquí puedes abrir detalles o permitir editar el producto.
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Producto: ${product.name}")),
              );
            },
          ),
        );
      },
    );
  }
}
