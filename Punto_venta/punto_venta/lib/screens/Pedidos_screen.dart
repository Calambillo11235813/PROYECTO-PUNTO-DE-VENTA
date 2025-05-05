import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:punto_venta/global/global_storage.dart';

Future<List<dynamic>> getPedidos(int idUsuario) async {
  final url = Uri.parse(
    'http://18.117.138.19:8000/ventas/pedidos/usuario/$idUsuario/',
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

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  late Future<List<dynamic>> _pedidosFuture;

  @override
  void initState() {
    super.initState();
    _pedidosFuture = getPedidos(GlobalStorage.userId ?? 0);
  }

  void _mostrarDetalles(BuildContext context, dynamic pedido) {
    final double total = double.tryParse(pedido['total'] ?? '0') ?? 0.0;
    final double iva = total * 0.16;
    final double subtotal = total - iva;
    final detalles = pedido['detalles'] ?? [];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Detalles del Pedido #${pedido['id']}'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Fecha: ${pedido['fecha'] ?? 'Fecha no disponible'}'),
                Text('Estado: ${pedido['estado'] ?? 'Desconocido'}'),
                Text(
                  'Tipo de venta: ${pedido['tipo_venta'] ?? 'Venta directa'}',
                ),
                Text('Cliente: ${pedido['cliente'] ?? 'General'}'),
                const SizedBox(height: 10),
                const Text(
                  'Productos:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                ...detalles.map<Widget>((detalle) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${detalle['producto']}'),
                        Text('Cantidad: ${detalle['cantidad']}'),
                      ],
                    ),
                  );
                }).toList(),
                const Divider(),
                Text('Subtotal: ${subtotal.toStringAsFixed(2)} US\$'),
                Text('IVA (16%): ${iva.toStringAsFixed(2)} US\$'),
                Text(
                  'Total: ${total.toStringAsFixed(2)} US\$',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cerrar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de Pedidos'),
        backgroundColor: const Color(0xFF55B84B),
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
            return const Center(child: Text('No hay pedidos disponibles'));
          }

          final pedidos = snapshot.data!;

          return ListView.builder(
            itemCount: pedidos.length,
            itemBuilder: (context, index) {
              final pedido = pedidos[index];
              final String fecha = pedido['fecha'] ?? 'Fecha no disponible';
              final String estado = pedido['estado'] ?? 'Desconocido';
              final String cliente = pedido['cliente'] ?? 'General';
              final String total = pedido['total'] ?? '0';

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: Text('#${pedido['id']}'),
                  title: Text('Cliente: $cliente'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Fecha: $fecha'),
                      Text('Estado: $estado'),
                      Text('Total: $total US\$'),
                    ],
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.remove_red_eye),
                    onPressed: () => _mostrarDetalles(context, pedido),
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
