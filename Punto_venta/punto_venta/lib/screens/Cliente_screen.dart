import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:punto_venta/global/global_storage.dart';

class Cliente {
  final int id;
  String nombre;
  String? cedulaIdentidad;
  String? telefono;
  String? direccion;
  String? email;

  Cliente({
    required this.id,
    required this.nombre,
    this.cedulaIdentidad,
    this.telefono,
    this.direccion,
    this.email,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) => Cliente(
    id: json['id'],
    nombre: json['nombre'],
    cedulaIdentidad: json['cedula_identidad'],
    telefono: json['telefono'],
    direccion: json['direccion'],
    email: json['email'],
  );

  Map<String, dynamic> toJson() => {
    'nombre': nombre,
    'cedula_identidad': cedulaIdentidad,
    'telefono': telefono,
    'direccion': direccion,
    'email': email,
    'usuario': GlobalStorage.userId, // necesario para POST/PUT
  };
}

class ClienteScreen extends StatefulWidget {
  const ClienteScreen({super.key});

  @override
  _ClientesScreenState createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClienteScreen> {
  late Future<List<Cliente>> _clientesFuture;
  List<Cliente> _clientes = [];

  @override
  void initState() {
    super.initState();
    _cargarClientes();
  }

  void _cargarClientes() {
    _clientesFuture = obtenerClientes(GlobalStorage.userId ?? 0);
    _clientesFuture.then((lista) {
      setState(() {
        _clientes = lista;
      });
    });
  }

  Future<List<Cliente>> obtenerClientes(int usuarioId) async {
    final url = Uri.parse(
      GlobalStorage.url + 'ventas/clientes/usuario/$usuarioId/',
    );
    final response = await http.get(url);
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Cliente.fromJson(json)).toList();
    } else {
      throw Exception('Error al obtener clientes: ${response.statusCode}');
    }
  }

  Future<void> eliminarCliente(int usuarioId, int clienteId) async {
    final url = Uri.parse(
      GlobalStorage.url + 'ventas/clientes/usuario/$usuarioId/$clienteId/',
    );
    final response = await http.delete(url);
    if (response.statusCode != 204) {
      throw Exception('Error al eliminar cliente: ${response.statusCode}');
    }
  }

  Future<bool> guardarCliente(Cliente cliente, {bool esNuevo = true}) async {
    final usuarioId = GlobalStorage.userId ?? 0;
    Uri url;
    http.Response response;

    if (esNuevo) {
      url = Uri.parse(
        GlobalStorage.url + 'ventas/clientes/usuario/$usuarioId/',
      );
      response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(cliente.toJson()),
      );
    } else {
      url = Uri.parse(
        GlobalStorage.url + 'ventas/clientes/usuario/$usuarioId/${cliente.id}/',
      );
      response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(cliente.toJson()),
      );
    }

    if (response.statusCode == 201 || response.statusCode == 200) {
      return true;
    } else {
      print('Error al guardar cliente: ${response.statusCode}');
      print(response.body);
      return false;
    }
  }

  void _mostrarFormularioCliente({Cliente? cliente}) {
    final esNuevo = cliente == null;
    final formKey = GlobalKey<FormState>();
    final TextEditingController nombreCtrl = TextEditingController(
      text: cliente?.nombre ?? '',
    );
    final TextEditingController cedulaCtrl = TextEditingController(
      text: cliente?.cedulaIdentidad ?? '',
    );
    final TextEditingController telefonoCtrl = TextEditingController(
      text: cliente?.telefono ?? '',
    );
    final TextEditingController direccionCtrl = TextEditingController(
      text: cliente?.direccion ?? '',
    );
    final TextEditingController emailCtrl = TextEditingController(
      text: cliente?.email ?? '',
    );

    showModalBottomSheet(
      context: context,
      backgroundColor: Color.fromARGB(255, 225, 225, 241),
      isScrollControlled: true,
      builder:
          (context) => Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      esNuevo ? 'Nuevo Cliente' : 'Modificar Cliente',
                      style: const TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF45a049),
                      ),
                    ),
                    const SizedBox(height: 15),
                    TextFormField(
                      controller: nombreCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nombre',
                        border: OutlineInputBorder(),
                      ),
                      validator:
                          (value) =>
                              value == null || value.isEmpty
                                  ? 'Requerido'
                                  : null,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: cedulaCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Cédula de Identidad',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: telefonoCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Teléfono',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: direccionCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Dirección',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: emailCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 20),

                    // FILA DE BOTONES
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(
                                0xFF45a049,
                              ), // texto verde
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              side: BorderSide.none, // ✅ ELIMINA EL BORDE NEGRO
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              if (!formKey.currentState!.validate()) return;

                              Cliente clienteNuevo = Cliente(
                                id: cliente?.id ?? 0,
                                nombre: nombreCtrl.text.trim(),
                                cedulaIdentidad:
                                    cedulaCtrl.text.trim().isEmpty
                                        ? null
                                        : cedulaCtrl.text.trim(),
                                telefono:
                                    telefonoCtrl.text.trim().isEmpty
                                        ? null
                                        : telefonoCtrl.text.trim(),
                                direccion:
                                    direccionCtrl.text.trim().isEmpty
                                        ? null
                                        : direccionCtrl.text.trim(),
                                email:
                                    emailCtrl.text.trim().isEmpty
                                        ? null
                                        : emailCtrl.text.trim(),
                              );

                              final success = await guardarCliente(
                                clienteNuevo,
                                esNuevo: esNuevo,
                              );

                              if (success) {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      esNuevo
                                          ? 'Cliente creado exitosamente'
                                          : 'Cliente modificado exitosamente',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    backgroundColor: const Color(0xFF45a049),
                                  ),
                                );
                                _cargarClientes();
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Error al guardar cliente'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(
                                0xFF45a049,
                              ), // fondo verde
                              foregroundColor: Colors.white, // texto blanco
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: Text(
                              esNuevo ? 'Registrar' : 'Modificar',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  void _confirmarEliminarCliente(Cliente cliente) {
    final parentContext = context; // Guardamos el contexto del StatefulWidget

    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15), // Ajusta el radio aquí
            ),
            backgroundColor: Color.fromARGB(255, 225, 225, 241),
            title: Center(
              child: Text(
                'Confirmar eliminación',
                style: TextStyle(
                  color: Color(0xFF45a049), // Verde
                  fontWeight: FontWeight.bold,
                  fontSize: 23,
                ),
              ),
            ),
            content: Text(
              '¿Seguro que quieres eliminar al cliente ${cliente.nombre}?',
            ),
            actionsPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
            actions: [
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      style: TextButton.styleFrom(
                        backgroundColor: Color(0xFF45a049),

                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 5),
                      ),
                      child: const Text(
                        'Cancelar',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(255, 255, 255, 255),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10), // Espacio entre botones
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        Navigator.pop(context); // Cerrar el diálogo

                        try {
                          await eliminarCliente(
                            GlobalStorage.userId ?? 0,
                            cliente.id,
                          );

                          if (mounted) {
                            _cargarClientes(); // Recargar clientes
                          }

                          ScaffoldMessenger.of(parentContext).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Cliente ${cliente.nombre} eliminado',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              backgroundColor: Color(0xFF45a049),
                            ),
                          );
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(parentContext).showSnackBar(
                              SnackBar(
                                content: Text('Error al eliminar cliente: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        side: BorderSide.none, // Elimina el borde
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 5),
                      ),
                      child: const Text(
                        'Eliminar',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                    ),
                  ),
                ],
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
          'Clientes',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: FutureBuilder<List<Cliente>>(
        future: _clientesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: const Text(
                'No hay clientes registrados',
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
            );
          }

          final clientes = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: clientes.length,
            itemBuilder: (context, index) {
              final cliente = clientes[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: ListTile(
                  title: Text(
                    cliente.nombre,
                    style: TextStyle(
                      color: Color(0xFF45a049), // Verde
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (cliente.cedulaIdentidad != null)
                        Text('Ci: ${cliente.cedulaIdentidad}'),
                      if (cliente.telefono != null)
                        Text('Telefono: ${cliente.telefono}'),
                      if (cliente.email != null)
                        Text('Email: ${cliente.email}'),
                    ],
                  ),

                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed:
                            () => _mostrarFormularioCliente(cliente: cliente),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _confirmarEliminarCliente(cliente),
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
        onPressed: () => _mostrarFormularioCliente(),
        backgroundColor: const Color(0xFF45a049),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
