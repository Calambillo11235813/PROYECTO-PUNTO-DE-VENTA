// lib/widgets/clients_widget.dart
import 'package:flutter/material.dart';
import '../models/client.dart';

/// Widget que muestra una lista de clientes utilizando el modelo [Client].
class ClientsWidget extends StatelessWidget {
  const ClientsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // Lista de clientes de ejemplo.
    final List<Client> clients = [
      Client(id: '1', name: 'Cliente 1', email: 'cliente1@example.com'),
      Client(id: '2', name: 'Cliente 2', email: 'cliente2@example.com'),
      Client(id: '3', name: 'Cliente 3', email: 'cliente3@example.com'),
      Client(id: '4', name: 'Cliente 4', email: 'cliente4@example.com'),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(8.0),
      itemCount: clients.length,
      itemBuilder: (context, index) {
        final client = clients[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
          child: ListTile(
            leading: const Icon(Icons.person),
            title: Text(client.name),
            subtitle: Text(client.email),
            onTap: () {
              // Aquí podrías navegar a una pantalla de detalles del cliente u ofrecer acciones.
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Seleccionado: ${client.name}")),
              );
            },
          ),
        );
      },
    );
  }
}
