// lib/screens/home_screen.dart
import 'package:flutter/material.dart';

/// Pantalla principal del sistema de punto de venta y facturación.
/// Aquí puedes extender la lógica de la aplicación para visualizar el dashboard,
/// el menú principal o cualquier funcionalidad que necesites.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sistema - Punto de Venta')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Bienvenido al sistema de punto de venta y facturación electrónica',
              style: TextStyle(fontSize: 18),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Navega a la pantalla del panel de gestión.
                Navigator.pushNamed(context, '/panel');
              },
              child: const Text('Ir al Panel'),
            ),
          ],
        ),
      ),
    );
  }
}
