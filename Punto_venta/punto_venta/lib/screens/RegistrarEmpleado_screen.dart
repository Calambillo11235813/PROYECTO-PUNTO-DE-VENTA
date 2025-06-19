import 'package:flutter/material.dart';

class RegistrarempleadoScreen extends StatelessWidget {
  const RegistrarempleadoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Empleados',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF55B84B),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: const Center(child: Text('Pantalla de Registro de Empleados')),
    );
  }
}
