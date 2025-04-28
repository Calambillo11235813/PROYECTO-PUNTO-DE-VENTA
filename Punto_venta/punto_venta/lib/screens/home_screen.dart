import 'package:flutter/material.dart';

/// Pantalla principal del sistema de punto de venta y facturación.
/// Rediseñada para coincidir con la estética de VentaFácil BO.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: const Color(0xFFF9FAFB), // Fondo gris claro
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Row(
            children: [
              // Columna izquierda con texto
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Ventafacil  Punto de Venta ',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF55B84B), // Verde para el título
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'El sistema contable y de facturación electrónica más fácil de usar en Bolivia.',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Emite comprobantes electrónicos requeridos desde cualquier lugar del país.',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/login');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF55B84B),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                      ),
                      child: const Text('Login'),
                    ),
                    const SizedBox(height: 16), // Espacio entre botones
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF55B84B),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                      ),
                      child: const Text('Register'),
                    ),
                  ],
                ),
              ),
              
              // Columna derecha con imagen
              Expanded(
                flex: 5,
                child: Center(
                  child: Image.asset(
                    'assets/images/punto_de_venta.png',
                    width: 400,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
