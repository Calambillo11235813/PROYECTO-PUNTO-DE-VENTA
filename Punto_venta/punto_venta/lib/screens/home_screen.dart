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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 50),
              const Text(
                'VentaFácil BO',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: Color(0xDD000000), // Verde para el título
                ),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Color.fromARGB(255, 225, 225, 241),
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                width: double.infinity,
                height: 400,
                padding: const EdgeInsets.all(20),
                child: Stack(
                  children: [
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Image.asset(
                        'assets/images/punto_de_venta.png',
                        width: 140,
                        height: 140,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Punto de Venta + Facturación Electrónica',
                          style: TextStyle(
                            fontSize: 27,
                            color: Color(0xFF45a049),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'El sistema contable y de facturación electrónica más fácil de usar en Bolivia.',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color.fromARGB(221, 78, 76, 76),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Emite comprobantes electrónicos\nrequeridos desde\n cualquier lugar\n del país.',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color.fromARGB(221, 78, 76, 76),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 30),
              Center(
                // Centra los botones en la pantalla
                child: Column(
                  children: [
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/login');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF45a049),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 70,
                          vertical: 15,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            10,
                          ), // Aquí puedes ajustar el radio de los bordes
                        ),
                      ),
                      child: const Text(
                        'Iniciar Sesión',
                        style: TextStyle(
                          fontSize: 15, // Tamaño de fuente
                          fontWeight: FontWeight.bold, // Peso (negrita, etc.)
                        ),
                      ),
                    ),
                    const SizedBox(height: 15), // Espacio entre botones
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF45a049),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 76,
                          vertical: 15,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            10,
                          ), // Aquí puedes ajustar el radio de los bordes
                        ),
                      ),
                      child: const Text(
                        'Registrarse',
                        style: TextStyle(
                          fontSize: 15, // Tamaño de fuente
                          fontWeight: FontWeight.bold, // Peso (negrita, etc.)
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/planes');
                      },
                      style: ButtonStyle(
                        foregroundColor: WidgetStateProperty.all(
                          Color(0xFF45a049),
                        ), // Color del texto
                        overlayColor: WidgetStateProperty.resolveWith<Color?>((
                          states,
                        ) {
                          if (states.contains(WidgetState.pressed)) {
                            return const Color(
                              0x3345a049,
                            ); // Verde con opacidad al presionar
                          }
                          return null;
                        }),
                        shape: WidgetStateProperty.all(
                          RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      child: const Text(
                        'Planes',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
