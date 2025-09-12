import 'package:flutter/material.dart';
import '../models/usuario.dart';
import '../services/usuario_service.dart';

void main() {
  runApp(const ClientesL());
}

class ClientesL extends StatelessWidget {
  const ClientesL({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestión de Clientes',
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      home: const ClientesListaPage(),
    );
  }
}

// Asumimos que ya existe un modelo Usuario en tu aplicación
// Si no existe, necesitarías adaptarlo desde el modelo Cliente actual

class ClientesListaPage extends StatefulWidget {
  const ClientesListaPage({super.key});

  @override
  State<ClientesListaPage> createState() => _ClientesListaPageState();
}

class _ClientesListaPageState extends State<ClientesListaPage> {
  List<Usuario> clientes = [];
  bool isLoading = true;
  String error = '';

  @override
  void initState() {
    super.initState();
    fetchClientes();
  }

  Future<void> fetchClientes() async {
    setState(() {
      isLoading = true;
      error = '';
    });

    try {
      // Aquí utilizamos el servicio mostrarCliente()
      final resultado = await UsuarioService.mostrarCliente();
      setState(() {
        clientes = resultado;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Error al cargar los clientes: $e';
        isLoading = false;
      });
      print('❌ Error al cargar clientes: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lista de Clientes'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body:
          isLoading
              ? const Center(child: CircularProgressIndicator())
              : error.isNotEmpty
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(error, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: fetchClientes,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              )
              : clientes.isEmpty
              ? const Center(child: Text('No hay clientes disponibles'))
              : RefreshIndicator(
                onRefresh: fetchClientes,
                child: ListView.builder(
                  itemCount: clientes.length,
                  itemBuilder: (context, index) {
                    final cliente = clientes[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                        vertical: 8,
                        horizontal: 16,
                      ),
                      elevation: 2,
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: CircleAvatar(
                          backgroundColor:
                              cliente.estado ? Colors.green : Colors.grey,
                          child: Text(
                            cliente.genero,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(
                          cliente.nombre,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('📧 ${cliente.correo}'),
                            Text('🏢 ${cliente.empresa.nombre}'),
                            Text('📍 ${cliente.direccion}'),
                          ],
                        ),
                        trailing: Icon(
                          cliente.isStaff
                              ? Icons.admin_panel_settings
                              : Icons.person,
                          color: cliente.isStaff ? Colors.blue : Colors.grey,
                        ),
                        onTap: () {
                          // Mostrar detalles del cliente
                          showDialog(
                            context: context,
                            builder:
                                (_) => AlertDialog(
                                  title: Text('Detalles de ${cliente.nombre}'),
                                  content: SingleChildScrollView(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('ID: ${cliente.id}'),
                                        Text('Correo: ${cliente.correo}'),
                                        Text(
                                          'Fecha de Nacimiento: ${cliente.fechaDeNacimiento}',
                                        ),
                                        Text('Género: ${cliente.genero}'),
                                        Text('Dirección: ${cliente.direccion}'),
                                        Text(
                                          'Estado: ${cliente.estado ? "Activo" : "Inactivo"}',
                                        ),
                                        const Divider(),
                                        Text(
                                          'Empresa: ${cliente.empresa.nombre}',
                                        ),
                                        Text('NIT: ${cliente.empresa.nit}'),
                                        Text(
                                          'Estado Empresa: ${cliente.empresa.estado ? "Activa" : "Inactiva"}',
                                        ),
                                        Text(
                                          'Staff: ${cliente.isStaff ? "Sí" : "No"}',
                                        ),
                                      ],
                                    ),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Cerrar'),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        // Aquí podrías navegar a una página de edición
                                        Navigator.pop(context);
                                      },
                                      child: const Text('Editar'),
                                    ),
                                  ],
                                ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Aquí puedes agregar la navegación para añadir un nuevo cliente
        },
        tooltip: 'Agregar Cliente',
        child: const Icon(Icons.add),
      ),
    );
  }
}
