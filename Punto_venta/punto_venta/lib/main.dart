// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/panel.dart';
import 'screens/menu_screen.dart';
import 'screens/register_screen.dart';
import 'screens/balance_screen.dart';
import 'screens/clientes_screen.dart';
import 'screens/config_screen.dart';
import 'screens/gestionar_ventas.dart';
import 'screens/inventario_screen.dart';
import 'screens/vender_screen.dart';
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
      initialRoute: '/home',
      routes: {
        
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
        '/panel': (context) => const Panel(),
        '/menu': (context) => const HomePage(),
        '/balance': (context) => const BalanceScreen(),
        '/clientes': (context) => const ClientesL(),
        '/config': (context) => const ConfigScreen(),
        '/ventasg': (context) => const GestionarVentasScreen(),
        '/inventario': (context) => const InventarioScreen(),
        '/vender': (context) => const SellScreen(),
        
      },
    );
  }
}
