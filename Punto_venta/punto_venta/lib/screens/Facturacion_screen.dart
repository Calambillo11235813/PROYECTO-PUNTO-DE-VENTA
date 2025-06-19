import 'package:flutter/material.dart';

class FacturacionScreen extends StatelessWidget {
  const FacturacionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Facturación',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(
        255,
        225,
        225,
        241,
      ), // Color de fondo personalizado
      body: const Center(
        child: Text(
          'Esta sección está en construcción. Pronto podrás ver las Facturas disponibles.',
          textAlign: TextAlign.center, // <-- esto centra el texto
          style: TextStyle(fontSize: 16, color: Colors.black54),
        ),
      ),
    );
  }
}
