import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:punto_venta/models/product.dart';
import 'package:punto_venta/global/global_storage.dart';

Future<void> registrarPedido(
  int usuarioId,
  double total,
  List<Map<String, dynamic>> detallesInput,
) async {
  final url = Uri.parse(
    'http://18.117.138.19:8000/ventas/pedidos/usuario/$usuarioId/',
  );

  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      // Agrega token si usas autenticación
      // 'Authorization': 'Bearer TU_TOKEN',
    },
    body: jsonEncode({'total': total, 'detalles_input': detallesInput}),
  );

  if (response.statusCode == 201) {
    print('Pedido registrado exitosamente');
    print(jsonDecode(response.body));
  } else {
    print('Error al registrar el pedido: ${response.statusCode}');
    print(response.body);
  }
}

Future<List<Producto>> obtenerProductos(int idUsuario) async {
  final url = Uri.parse(
    'http://18.117.138.19:8000/productos/crear/usuario/$idUsuario/',
  );

  try {
    final response = await http.get(url);

    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((json) => Producto.fromJson(json)).toList();
    } else {
      throw Exception('Error al obtener productos: ${response.statusCode}');
    }
  } catch (e) {
    throw Exception('Error de conexión: $e');
  }
}

class VentasScreen extends StatefulWidget {
  const VentasScreen({super.key});

  @override
  _VentasScreenState createState() => _VentasScreenState();
}

class _VentasScreenState extends State<VentasScreen> {
  late Future<List<Producto>> _productosFuture;
  final Map<Producto, int> _carrito = {};

  @override
  void initState() {
    super.initState();
    _productosFuture = obtenerProductos(GlobalStorage.userId ?? 0);
  }

  void _agregarAlCarrito(Producto producto) {
    setState(() {
      if (_carrito.containsKey(producto)) {
        _carrito[producto] = _carrito[producto]! + 1;
      } else {
        _carrito[producto] = 1;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${producto.nombre} agregado al carrito'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.green,
      ),
    );
  }

  void _mostrarCarrito() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final subtotal = _carrito.entries.fold<double>(
              0,
              (total, entry) =>
                  total + (double.parse(entry.key.precioVenta) * entry.value),
            );
            final impuestos = subtotal * 0.16;
            final total = subtotal + impuestos;

            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Carrito de Compras',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ..._carrito.entries.map(
                      (entry) => Card(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        child: ListTile(
                          title: Text(entry.key.nombre),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '\$${entry.key.precioVenta} c/u  |  Total: \$${(double.parse(entry.key.precioVenta) * entry.value).toStringAsFixed(2)}',
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove),
                                    onPressed: () {
                                      setModalState(() {
                                        if (_carrito[entry.key]! > 1) {
                                          _carrito[entry.key] =
                                              _carrito[entry.key]! - 1;
                                        } else {
                                          _carrito.remove(entry.key);
                                        }
                                      });
                                    },
                                  ),
                                  Text('${entry.value}'),
                                  IconButton(
                                    icon: const Icon(Icons.add),
                                    onPressed: () {
                                      setModalState(() {
                                        _carrito[entry.key] =
                                            _carrito[entry.key]! + 1;
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () {
                              setModalState(() {
                                _carrito.remove(entry.key);
                              });
                            },
                          ),
                        ),
                      ),
                    ),
                    const Divider(),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Subtotal: \$${subtotal.toStringAsFixed(2)}'),
                          Text(
                            'Impuestos (16%): \$${impuestos.toStringAsFixed(2)}',
                          ),
                          Text(
                            'Total: \$${total.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: () async {
                        if (_carrito.isEmpty) return;

                        final detallesInput =
                            _carrito.entries.map((entry) {
                              return {
                                'producto_id': entry.key.id,
                                'cantidad': entry.value,
                              };
                            }).toList();

                        final subtotal = _carrito.entries.fold<double>(
                          0,
                          (total, entry) =>
                              total +
                              (double.parse(entry.key.precioVenta) *
                                  entry.value),
                        );
                        final impuestos = subtotal * 0.16;
                        final total = subtotal + impuestos;

                        final usuarioId = GlobalStorage.userId ?? 0;

                        await registrarPedido(usuarioId, total, detallesInput);

                        // Limpiar carrito y cerrar modal
                        setState(() {
                          _carrito.clear();
                        });
                        if (context.mounted) Navigator.pop(context);

                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Venta registrada exitosamente'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF55B84B),
                      ),
                      child: const Text(
                        'Finalizar Venta',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Ventas',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF55B84B),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: _mostrarCarrito,
          ),
        ],
      ),
      body: FutureBuilder<List<Producto>>(
        future: _productosFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No hay productos disponibles'));
          }

          final productos = snapshot.data!;

          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: productos.length,
            itemBuilder: (context, index) {
              final producto = productos[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 8),
                elevation: 2,
                child: ListTile(
                  leading: const Icon(Icons.shopping_bag, size: 40),
                  title: Text(producto.nombre),
                  subtitle: Text(
                    'Precio: \$${producto.precioVenta}\nStock: ${producto.stock}',
                  ),
                  trailing: ElevatedButton(
                    onPressed: () => _agregarAlCarrito(producto),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF55B84B),
                    ),
                    child: const Text(
                      'Agregar',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
