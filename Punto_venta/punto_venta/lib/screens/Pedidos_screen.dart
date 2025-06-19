import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:punto_venta/global/global_storage.dart';
import 'package:punto_venta/models/product.dart';

Future<double> obtenerPrecioProducto(
  int usuarioId,
  String nombreProducto,
) async {
  try {
    final response = await http.get(
      Uri.parse(GlobalStorage.url + 'productos/crear/usuario/$usuarioId/'),
    );

    if (response.statusCode == 200) {
      final List<dynamic> productos = jsonDecode(
        utf8.decode(response.bodyBytes),
      );

      final productoEncontrado = productos.firstWhere(
        (producto) =>
            producto['nombre'].toString().toLowerCase() ==
            nombreProducto.toLowerCase(),
        orElse: () => null,
      );

      if (productoEncontrado != null) {
        return double.tryParse(productoEncontrado['precio_venta'].toString()) ??
            0.0;
      }
    }
    return 0.0;
  } catch (e) {
    print('Error al obtener precio del producto: $e');
    return 0.0;
  }
}

Future<List<dynamic>> getPedidos(int idUsuario) async {
  final url = Uri.parse(
    GlobalStorage.url + 'ventas/pedidos/usuario/$idUsuario/',
  );

  try {
    final response = await http.get(url);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Error al cargar los pedidos');
    }
  } catch (e) {
    print('Excepción: $e');
    return [];
  }
}

Future<Map<int, String>> getTiposPago() async {
  final url = Uri.parse(GlobalStorage.url + 'ventas/tipo-pago/');
  try {
    final response = await http.get(url);
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return {for (var item in data) item['id']: item['nombre']};
    } else {
      throw Exception('Error al obtener tipos de pago');
    }
  } catch (e) {
    return {};
  }
}

Future<Map<int, String>> getEstados() async {
  final url = Uri.parse(GlobalStorage.url + 'ventas/estados/');
  try {
    final response = await http.get(url);
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return {for (var item in data) item['id']: item['descripcion']};
    } else {
      throw Exception('Error al obtener estados');
    }
  } catch (e) {
    return {};
  }
}

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  late Future<List<dynamic>> _pedidosFuture;
  Map<int, String> _tiposPago = {};
  Map<int, String> _estados = {};

  @override
  void initState() {
    super.initState();
    _pedidosFuture = getPedidos(GlobalStorage.userId ?? 0);
    getTiposPago().then((value) => setState(() => _tiposPago = value));
    getEstados().then((value) => setState(() => _estados = value));
  }

  void _mostrarDetalles(BuildContext context, dynamic pedido, int index) async {
    final double total =
        double.tryParse(pedido['total']?.toString() ?? '0') ?? 0.0;
    final double iva = total * 0.16;
    final double subtotal = total - iva;
    final List<dynamic> detalles = pedido['detalles'] ?? [];
    final transacciones = pedido['transacciones'] ?? [];

    final int usuarioId = GlobalStorage.userId ?? 0;
    final List<Map<String, dynamic>> productosConPrecio = [];

    for (var detalle in detalles) {
      final int cantidad = detalle['cantidad'] ?? 0;
      final String nombreProducto = detalle['producto'] ?? 'Desconocido';

      final double precioUnitario = await obtenerPrecioProducto(
        usuarioId,
        nombreProducto,
      );
      final double subtotalProducto = precioUnitario * cantidad;

      productosConPrecio.add({
        'nombre': nombreProducto,
        'cantidad': cantidad,
        'precio_unitario': precioUnitario,
        'subtotal': subtotalProducto,
      });
    }

    // Mostrar modal
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Detalles del Pedido #${index + 1}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 23,
                    color: Color(0xFF45a049),
                  ),
                ),
                const SizedBox(height: 10),
                Text('Fecha: ${pedido['fecha'] ?? 'Fecha no disponible'}'),
                Text(
                  'Tipo de venta: ${pedido['tipo_venta'] ?? 'Venta directa'}',
                ),
                Text('Cliente: ${pedido['cliente'] ?? 'General'}'),
                const SizedBox(height: 10),
                const Divider(),
                const Text(
                  'Productos:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15.5),
                ),

                ...productosConPrecio.map((producto) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Producto: ${producto['nombre']}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text('Cantidad: ${producto['cantidad']}'),
                        Text(
                          'Precio Unitario: ${producto['precio_unitario'].toStringAsFixed(2)} BOB',
                        ),
                        Text(
                          'Subtotal: ${producto['subtotal'].toStringAsFixed(2)} BOB',
                        ),
                      ],
                    ),
                  );
                }).toList(),
                const SizedBox(height: 3),
                const Divider(),
                Text('Subtotal: ${subtotal.toStringAsFixed(2)} BOB'),
                Text('IVA (16%): ${iva.toStringAsFixed(2)} BOB'),
                Text(
                  'Total: ${total.toStringAsFixed(2)} BOB',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 30),
                Align(
                  alignment: Alignment.center,
                  child: SizedBox(
                    width: 220, // ancho fijo que quieres
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: const Color(0xFF45a049), // verde
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(
                          vertical: 12,
                        ), // alto agradable
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text(
                        'Cerrar',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Lista de Ventas',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: FutureBuilder<List<dynamic>>(
        future: _pedidosFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text(
                'No hay pedidos disponibles',
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
            );
          }

          final pedidos = snapshot.data!;

          return ListView.builder(
            itemCount: pedidos.length,
            itemBuilder: (context, index) {
              final pedido = pedidos[index];
              final String fecha = pedido['fecha'] ?? 'Fecha no disponible';
              final String cliente = pedido['cliente'] ?? 'General';
              final String total = pedido['total']?.toString() ?? '0';

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Color(0xFF45a049),
                      fontWeight: FontWeight.bold,
                      fontSize: 18.5,
                    ),
                  ),
                  title: Text('Cliente: $cliente'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Fecha: $fecha'),
                      Text('Total: $total BOB'),
                    ],
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      Icons.open_in_new,
                      color: Color(0xFF45a049),
                      size: 29,
                    ),
                    onPressed: () => _mostrarDetalles(context, pedido, index),
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
