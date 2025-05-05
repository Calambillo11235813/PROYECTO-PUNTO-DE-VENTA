import 'package:flutter/material.dart';

class ReportesScreen extends StatelessWidget {
  const ReportesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Reportes',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF55B84B),
      ),
      backgroundColor: const Color.fromARGB(
        255,
        225,
        225,
        241,
      ), // Color de fondo personalizado
      body: const Center(child: Text('Pantalla de Reportes')),
    );
  }
}
