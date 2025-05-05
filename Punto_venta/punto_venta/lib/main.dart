import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/menu_screen.dart';
import 'screens/register_screen.dart';
import 'screens/Planes_screen.dart';
import 'screens/Dashboard_screen.dart';
import 'screens/Ventas_screen.dart';
import 'screens/Inventario_screen.dart';
import 'screens/Facturacion_screen.dart';
import 'screens/Reportes_screen.dart';
import 'screens/Configuracion_screen.dart';
import 'screens/Pedidos_screen.dart';

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
        '/menu': (context) => const HomePage(),
        '/planes': (context) => const PlanesPage(),
        '/Dashboard': (context) => const DashboardScreen(),
        '/pedidos': (context) => const PedidosScreen(),
        '/ventas': (context) => const VentasScreen(),
        '/inventario': (context) => const InventarioScreen(),
        '/facturacion': (context) => const FacturacionScreen(),
        '/reportes': (context) => const ReportesScreen(),
        '/configuracion': (context) => const ConfiguracionScreen(),
      },
    );
  }
}
