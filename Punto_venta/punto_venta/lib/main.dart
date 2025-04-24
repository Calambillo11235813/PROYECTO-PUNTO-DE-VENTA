// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/panel.dart';

void main() {
  runApp(const MyApp());
}

/// Widget raíz de la aplicación.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Punto de Venta y Facturación',
      theme: ThemeData(primarySwatch: Colors.blue),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/panel': (context) => const Panel(),
      },
    );
  }
}
