// menu_screen.dart
import 'package:flutter/material.dart';

class HomePageSuperv extends StatelessWidget {
  const HomePageSuperv({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'POS System',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF55B84B),
      ),

      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color.fromARGB(255, 225, 225, 241),
              Color.fromARGB(255, 225, 225, 241),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: [
                      MenuCard(
                        icon: Icons.storefront,
                        label: 'Dashboard',
                        route: '/Dashboard',
                      ),
                      MenuCard(
                        icon: Icons.shopping_bag,
                        label: 'Lista de Ventas',
                        route: '/pedidos',
                      ),
                      MenuCard(
                        icon: Icons.inventory_2,
                        label: 'Inventario',
                        route: '/inventario',
                      ),
                      MenuCard(
                        icon: Icons.person,
                        label: ' Clientes',
                        route: '/cliente',
                      ),
                      MenuCard(
                        icon: Icons.man,
                        label: 'Empleado',
                        route: '/empleado',
                      ),
                      MenuCard(
                        icon: Icons.description,
                        label: 'Facturacion',
                        route: '/facturacion',
                      ),
                      MenuCard(
                        icon: Icons.bar_chart,
                        label: 'Reportes',
                        route: '/reportes',
                      ),
                      MenuCard(
                        icon: Icons.settings,
                        label: 'Configuracion',
                        route: '/configuracion',
                      ),
                      MenuCard(
                        icon: Icons.exit_to_app,
                        label: 'Cerrar Sesión',
                        route: '/cerrarSesion',
                      ),
                    ],
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

class MenuCard extends StatefulWidget {
  final IconData icon;
  final String label;
  final String route;

  const MenuCard({
    super.key,
    required this.icon,
    required this.label,
    required this.route,
  });

  @override
  State<MenuCard> createState() => _MenuCardState();
}

class _MenuCardState extends State<MenuCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        if (widget.label == 'Cerrar Sesión') {
          Navigator.pushReplacementNamed(context, '/login');
        } else {
          Navigator.pushNamed(context, widget.route);
        }
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        transform: Matrix4.translationValues(0, _isPressed ? 0 : -2, 0),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF).withOpacity(0.9),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_isPressed ? 0.1 : 0.2),
              blurRadius: _isPressed ? 4 : 8,
              offset: Offset(0, _isPressed ? 2 : 4),
              spreadRadius: _isPressed ? 1 : 2,
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(widget.icon, size: 48, color: const Color(0xFF2E7D32)),
            const SizedBox(height: 10),
            Text(
              widget.label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF333333),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
