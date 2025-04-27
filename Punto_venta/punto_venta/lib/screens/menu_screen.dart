import 'package:flutter/material.dart';

void main() {
  runApp(const TiendaApp());
}

class TiendaApp extends StatelessWidget {
  const TiendaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Roboto',
        primaryColor: const Color(0xFF43A047),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF43A047),
          primary: const Color(0xFF43A047),
          secondary: const Color(0xFF66BB6A),
        ),
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF43A047), Color(0xFF66BB6A)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFFFF).withValues(
                    red: 255,
                    green: 255,
                    blue: 255,
                    alpha: 25,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      spreadRadius: 1,
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            spreadRadius: 1,
                            blurRadius: 3,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.person_outline,
                        color: Colors.black54,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFFFF).withValues(
                            red: 255,
                            green: 255,
                            blue: 255,
                            alpha: 230,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              spreadRadius: 1,
                              blurRadius: 3,
                            ),
                          ],
                        ),
                        child: const Text(
                          'Tienda Usuario',
                          style: TextStyle(
                            color: Color(0xFF2E7D32),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Main Menu Grid
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: const [
                      MenuCard(
                        icon: Icons.storefront,
                        label: 'Gestionar Ventas',
                      ),
                      MenuCard(
                        icon: Icons.shopping_cart,
                        label: 'Vender',
                      ),
                      MenuCard(
                        icon: Icons.inventory_2,
                        label: 'Inventario',
                      ),
                      MenuCard(
                        icon: Icons.people,
                        label: 'Lista de Clientes',
                      ),
                      MenuCard(
                        icon: Icons.bar_chart,
                        label: 'Balance',
                      ),
                      MenuCard(
                        icon: Icons.settings,
                        label: 'Configuración',
                      ),
                    ],
                  ),
                ),
              ),

              // Footer
              Container(
                height: 4,
                color: const Color(0xFFFFFFFF).withValues(
                  red: 255,
                  green: 255,
                  blue: 255,
                  alpha: 77,
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

  const MenuCard({
    super.key,
    required this.icon,
    required this.label,
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
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        transform: Matrix4.translationValues(0, _isPressed ? 0 : -2, 0),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFFFF).withValues(
            red: 255,
            green: 255,
            blue: 255,
            alpha: 230,
          ),
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
            Icon(
              widget.icon,
              size: 48,
              color: const Color(0xFF2E7D32),
            ),
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
