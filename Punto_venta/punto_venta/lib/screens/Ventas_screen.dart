// ventas_screen.dart
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:punto_venta/models/product.dart';
import 'package:punto_venta/global/global_storage.dart';

class TipoPago {
  final int id;
  final String nombre;

  TipoPago({required this.id, required this.nombre});

  factory TipoPago.fromJson(Map<String, dynamic> json) {
    return TipoPago(id: json['id'], nombre: json['nombre']);
  }
}

Future<List<TipoPago>> obtenerTiposPago() async {
  final url = Uri.parse(GlobalStorage.url + 'ventas/tipo-pago/');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    final List<dynamic> data = json.decode(response.body);
    return data.map((item) => TipoPago.fromJson(item)).toList();
  } else {
    throw Exception('Error al obtener tipos de pago');
  }
}

List<TipoPago> listaTiposPago = []; // Se llenará al llamar obtenerTiposPago()
Future<void> cargarTiposPago() async {
  listaTiposPago = await obtenerTiposPago();
}

Map<String, dynamic>? cajaActual;

Future<void> registrarPedido(
  int usuarioId,
  double total,
  List<Map<String, dynamic>> detallesInput,
  List<Map<String, dynamic>> transaccionesInput,
) async {
  final url = Uri.parse(
    GlobalStorage.url + 'ventas/pedidos/usuario/$usuarioId/',
  );

  final body = {
    'estado': 1, // Por ejemplo, pagado
    'total': total,
    'detalles_input': detallesInput,
    'transacciones_input': transaccionesInput,
  };

  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(body),
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
    GlobalStorage.url + 'productos/crear/usuario/$idUsuario/',
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
    fetchCajaActual();
  }

  Future<void> fetchCajaActual() async {
    final response = await http.get(
      Uri.parse(
        GlobalStorage.url + 'ventas/caja/actual/${GlobalStorage.userId}/',
      ),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      cajaActual = data;
    } else if (response.statusCode == 404) {
      // No hay caja abierta, poner cajaActual en null
      cajaActual = null;
    } else {
      throw Exception('Error al obtener la caja actual');
    }

    setState(() {});
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
        content: Text(
          '${producto.nombre} agregado al carrito',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.fixed, // Esto hace que ocupe todo el ancho
        backgroundColor: Colors.green,
      ),
    );
  }

  //---------------------------------------------------------------------------------------------------
  void _mostrarCarrito() async {
    // Cargar tipos de pago antes de mostrar el modal
    try {
      listaTiposPago = await obtenerTiposPago();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al cargar tipos de pago: $e'),
          backgroundColor: Colors.red,
        ),
      );
      return; // No mostrar modal si falla
    }

    TextEditingController totalController = TextEditingController();
    TipoPago? tipoPagoSeleccionado;
    bool botonHabilitado = false; // Controla si se habilita el botón

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent, // importante para bordes redondeados
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final subtotal = _carrito.entries.fold<double>(
              0,
              (total, entry) =>
                  total + (double.parse(entry.key.precioVenta) * entry.value),
            );
            final impuestos = subtotal * 0.16;
            final totalCalculado = subtotal + impuestos;

            void actualizarBotonHabilitado(String valorIngresado) {
              final montoIngresado = double.tryParse(valorIngresado);
              bool habilitar =
                  (montoIngresado != null &&
                      (montoIngresado - totalCalculado).abs() < 0.01 &&
                      tipoPagoSeleccionado != null);
              setModalState(() {
                botonHabilitado = habilitar;
              });
            }

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ), // Esto eleva el modal cuando se abre el teclado
              child: Container(
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 225, 225, 241),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
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
                          color: Color(0xFF45a049),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ..._carrito.entries.map(
                        (entry) => Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          child: ListTile(
                            title: Text(
                              entry.key.nombre,
                              style: const TextStyle(
                                color: Color(0xFF45a049),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${entry.key.precioVenta} BOB c/u\nTotal: ${(double.parse(entry.key.precioVenta) * entry.value).toStringAsFixed(2)} BOB',
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
                                        Future.microtask(() {
                                          actualizarBotonHabilitado(
                                            totalController.text,
                                          );
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
                                        Future.microtask(() {
                                          actualizarBotonHabilitado(
                                            totalController.text,
                                          );
                                        });
                                      },
                                    ),
                                    const Spacer(),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.delete,
                                        color: Color.fromARGB(255, 255, 51, 0),
                                      ),
                                      onPressed: () {
                                        setModalState(() {
                                          _carrito.remove(entry.key);
                                        });
                                        Future.microtask(() {
                                          actualizarBotonHabilitado(
                                            totalController.text,
                                          );
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const Divider(),

                      if (_carrito.isEmpty) ...[
                        const Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.shopping_cart_outlined,
                                size: 60,
                                color: Color(0xFF45a049),
                              ),
                              SizedBox(height: 10),
                              Text(
                                'El carrito está vacío',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Color(0xFF45a049),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 20),
                            ],
                          ),
                        ),
                      ],

                      if (_carrito.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: TextField(
                                controller: totalController,
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                      decimal: true,
                                    ),
                                decoration: const InputDecoration(
                                  labelText: 'Total',
                                  border: OutlineInputBorder(),
                                  hintText: 'Ingrese monto total',
                                ),
                                onChanged: (value) {
                                  actualizarBotonHabilitado(value);
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 3,
                              child: DropdownButtonFormField<TipoPago>(
                                value: tipoPagoSeleccionado,
                                hint: const Text('Tipo de Pago'),
                                items:
                                    listaTiposPago.map((tipo) {
                                      return DropdownMenuItem<TipoPago>(
                                        value: tipo,
                                        child: Text(tipo.nombre),
                                      );
                                    }).toList(),
                                onChanged: (newValue) {
                                  setModalState(() {
                                    tipoPagoSeleccionado = newValue;
                                  });
                                  actualizarBotonHabilitado(
                                    totalController.text,
                                  );
                                },
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 20),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Subtotal: ${subtotal.toStringAsFixed(2)} BOB',
                            ),
                            Text(
                              'Impuestos (16%): ${impuestos.toStringAsFixed(2)} BOB',
                            ),
                            Text(
                              'Total calculado: ${totalCalculado.toStringAsFixed(2)} BOB',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: 200, // ancho fijo que puedes modificar
                        child: ElevatedButton(
                          onPressed:
                              botonHabilitado
                                  ? () async {
                                    if (_carrito.isEmpty) return;

                                    double totalIngresado = double.parse(
                                      totalController.text,
                                    );

                                    final detallesInput =
                                        _carrito.entries.map((entry) {
                                          return {
                                            'producto_id': entry.key.id,
                                            'cantidad': entry.value,
                                          };
                                        }).toList();

                                    final transaccionesInput = [
                                      {
                                        'tipo_pago_id':
                                            tipoPagoSeleccionado!.id,
                                        'monto': totalIngresado,
                                      },
                                    ];

                                    final usuarioId = GlobalStorage.userId ?? 0;

                                    await registrarPedido(
                                      usuarioId,
                                      totalIngresado,
                                      detallesInput,
                                      transaccionesInput,
                                    );

                                    setState(() {
                                      _carrito.clear();
                                    });
                                    if (context.mounted) Navigator.pop(context);

                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Venta registrada exitosamente',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        backgroundColor: Color(0xFF45a049),
                                      ),
                                    );
                                  }
                                  : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                botonHabilitado
                                    ? const Color(0xFF45a049)
                                    : Colors.grey,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'Finalizar Venta',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  //---------------------------------------------------------------------------------------------------
  @override
  @override
  Widget build(BuildContext context) {
    if (cajaActual == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Punto de Venta',
            style: TextStyle(
              fontSize: 27,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: const Color(0xFF45a049),
        ),
        backgroundColor: const Color.fromARGB(255, 225, 225, 241),
        body: const Center(
          child: Text(
            'Primero tienes que abrir una caja!',
            style: TextStyle(
              fontSize: 16,
              color: Colors.black54, // Texto en gris para texto secundario
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    // Si hay caja abierta, mostramos el listado normal
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Punto de Venta',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: _mostrarCarrito,
            color: Colors.white,
          ),
        ],
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
            return const Center(
              child: Text(
                'No hay productos disponibles',
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
            );
          }

          final productos = snapshot.data!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 📅 Sección de fecha y hora de apertura
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  vertical: 10,
                  horizontal: 16,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time, color: Color(0xFF45a049)),
                    const SizedBox(width: 8),
                    Text(
                      'Caja abierta: ${cajaActual?['fecha_apertura'] != null ? _formatearFechaHora(cajaActual?['fecha_apertura']) : 'Sin información'}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF45a049),
                      ),
                    ),
                  ],
                ),
              ),

              // 🛍 Lista de productos
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                  itemCount: productos.length,
                  itemBuilder: (context, index) {
                    final producto = productos[index];
                    return Card(
                      margin: const EdgeInsets.fromLTRB(0, 0, 0, 10),
                      elevation: 2,
                      child: ListTile(
                        leading:
                            producto.imagenUrl != null
                                ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    producto.imagenUrl!,
                                    width: 50,
                                    height: 50,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Icon(
                                              Icons.broken_image,
                                              size: 40,
                                            ),
                                    loadingBuilder: (
                                      context,
                                      child,
                                      loadingProgress,
                                    ) {
                                      if (loadingProgress == null) return child;
                                      return const SizedBox(
                                        width: 50,
                                        height: 50,
                                        child: Center(
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                )
                                : const Icon(
                                  Icons.image_not_supported,
                                  size: 40,
                                ),
                        title: Text(producto.nombre),
                        subtitle: Text(
                          'Precio: ${producto.precioVenta} BOB\nStock: ${producto.stock}',
                        ),
                        trailing: ElevatedButton(
                          onPressed: () => _agregarAlCarrito(producto),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF45a049),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'Agregar',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // 🔧 Función para formatear fecha y hora
  String _formatearFechaHora(String fechaIso) {
    final fecha =
        DateTime.parse(fechaIso).toLocal(); // convierte de UTC a local
    return '${fecha.day}/${fecha.month}/${fecha.year} - '
        '${fecha.hour.toString().padLeft(2, '0')}:'
        '${fecha.minute.toString().padLeft(2, '0')}:'
        '${fecha.second.toString().padLeft(2, '0')}';
  }
}
