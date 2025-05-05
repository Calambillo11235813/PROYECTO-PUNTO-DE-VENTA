import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:punto_venta/models/product.dart';
import 'package:punto_venta/global/global_storage.dart';

Future<void> obtenerDetalleProducto({
  required int usuarioId,
  required int productoId,
}) async {
  final url = Uri.parse(
    'http://18.117.138.19:8000/productos/detalles/usuario/$usuarioId/$productoId/',
  );

  try {
    final response = await http.delete(
      url,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('📦 Producto: ${data['nombre']}');
      print('💵 Precio Venta: ${data['precio_venta']}');
      print('👤 Usuario: ${data['usuario']['nombre']}');
    } else {
      print('❌ Error al obtener producto: ${response.statusCode}');
    }
  } catch (e) {
    print('⚠️ Error de conexión: $e');
  }
}

Future<void> crearProducto({
  required int usuarioId,
  required String nombre,
  required double precioCompra,
  required double precioVenta,
  required String descripcion,
  required int stockInicial,
  required int cantidadMinima,
  required int cantidadMaxima,
}) async {
  final url = Uri.parse(
    'http://18.117.138.19:8000/productos/crear/usuario/$usuarioId/',
  );

  final Map<String, dynamic> body = {
    "nombre": nombre,
    "precio_compra": precioCompra,
    "precio_venta": precioVenta,
    "descripcion": descripcion,
    "usuario_id": usuarioId,
    "stock_inicial": stockInicial,
    "cantidad_minima": cantidadMinima,
    "cantidad_maxima": cantidadMaxima,
  };

  try {
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final responseData = jsonDecode(response.body);
      print("✅ Producto creado: ${responseData['nombre']}");
    } else {
      print("❌ Error ${response.statusCode}: ${response.body}");
    }
  } catch (e) {
    print("⚠️ Error de conexión: $e");
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

class InventarioScreen extends StatefulWidget {
  const InventarioScreen({super.key});

  @override
  State<InventarioScreen> createState() => _InventarioScreenState();
}

class _InventarioScreenState extends State<InventarioScreen> {
  late Future<List<Producto>> _productosFuture;

  @override
  void initState() {
    super.initState();
    _cargarProductos();
  }

  void _cargarProductos() {
    final int idUsuario = GlobalStorage.userId ?? 0;
    _productosFuture = obtenerProductos(idUsuario);
  }

  void _mostrarFormularioCrearProducto(BuildContext context) {
    final TextEditingController nombreController = TextEditingController();
    final TextEditingController precioCompraController =
        TextEditingController();
    final TextEditingController precioVentaController = TextEditingController();
    final TextEditingController descripcionController = TextEditingController();
    final TextEditingController stockController = TextEditingController();
    final TextEditingController minController = TextEditingController();
    final TextEditingController maxController = TextEditingController();

    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            title: const Text("Nuevo Producto"),
            content: SingleChildScrollView(
              child: Column(
                children: [
                  TextField(
                    controller: nombreController,
                    decoration: const InputDecoration(labelText: 'Nombre'),
                  ),
                  TextField(
                    controller: precioCompraController,
                    decoration: const InputDecoration(
                      labelText: 'Precio de Compra',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: precioVentaController,
                    decoration: const InputDecoration(
                      labelText: 'Precio de Venta',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: descripcionController,
                    decoration: const InputDecoration(labelText: 'Descripción'),
                  ),
                  TextField(
                    controller: stockController,
                    decoration: const InputDecoration(
                      labelText: 'Stock Inicial',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: minController,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad Mínima',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: maxController,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad Máxima',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text("Cancelar"),
              ),
              ElevatedButton(
                onPressed: () async {
                  final int idUsuario = GlobalStorage.userId ?? 0;

                  await crearProducto(
                    usuarioId: idUsuario,
                    nombre: nombreController.text,
                    precioCompra:
                        double.tryParse(precioCompraController.text) ?? 0,
                    precioVenta:
                        double.tryParse(precioVentaController.text) ?? 0,
                    descripcion: descripcionController.text,
                    stockInicial: int.tryParse(stockController.text) ?? 0,
                    cantidadMinima: int.tryParse(minController.text) ?? 0,
                    cantidadMaxima: int.tryParse(maxController.text) ?? 0,
                  );

                  Navigator.of(context).pop();
                  setState(() {
                    _cargarProductos();
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF55B84B),
                  foregroundColor: Colors.white,
                ),
                child: const Text("Crear"),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Inventario',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF55B84B),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: FutureBuilder<List<Producto>>(
        future: _productosFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No hay productos disponibles.'));
          }

          final productos = snapshot.data!;

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: productos.length,
            itemBuilder: (context, index) {
              final producto = productos[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                elevation: 2,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ID: ${producto.id} - ${producto.nombre}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text('Precio compra: \$${producto.precioCompra}'),
                      Text('Precio venta: \$${producto.precioVenta}'),
                      Text('Stock: ${producto.stock}'),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF55B84B),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                          ),
                          onPressed: () async {
                            final int idUsuario = GlobalStorage.userId ?? 0;

                            // Aquí llamas al método que elimina (simulado con obtenerDetalleProducto)
                            await obtenerDetalleProducto(
                              usuarioId: idUsuario,
                              productoId: producto.id,
                            );

                            // Recarga la lista después
                            setState(() {
                              _cargarProductos();
                            });
                          },
                          child: const Text('Eliminar'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF55B84B),
        onPressed: () => _mostrarFormularioCrearProducto(context),
        child: const Icon(Icons.add),
      ),
    );
  }
}
