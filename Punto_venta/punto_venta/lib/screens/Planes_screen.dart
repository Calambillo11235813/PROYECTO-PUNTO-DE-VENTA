import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Planes'), // Título del AppBar
      ),
      body: Center(
        child: Text('Contenido de la página de planes'), // Contenido principal
      ),
    );
  }
}

class PlanesPage extends StatelessWidget {
  const PlanesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Planes", // Título de la AppBar
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.white, // Título en color blanco
          ),
        ),
        backgroundColor: const Color(0xFF45a049), // Color verde en AppBar
      ),
      backgroundColor: const Color.fromARGB(
        255,
        225,
        229,
        231,
      ), // Fondo gris claro
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: const [
              SizedBox(height: 16),
              Text(
                'Esta sección está en construcción. Pronto podrás ver los planes disponibles.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.black54, // Texto en gris para texto secundario
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
