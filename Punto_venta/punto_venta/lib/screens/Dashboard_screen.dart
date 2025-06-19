import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      appBar: AppBar(
        title: const Text(
          'Dashboard',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            // Métricas principales
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: const [
                _MetricCard(
                  title: 'Ventas del día',
                  value: '120',
                  subtitle: '+15% vs. ayer',
                  subtitleColor: Color(0xFF45a049),
                ),
                _MetricCard(
                  title: 'Transacciones',
                  value: '42',
                  subtitle: '+8% vs. ayer',
                  subtitleColor: Color(0xFF45a049),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: const [
                _MetricCard(
                  title: 'Ticket Promedio',
                  value: '\$29.75',
                  subtitle: '+5% vs. ayer',
                  subtitleColor: Color(0xFF45a049),
                ),
                _MetricCard(
                  title: 'Facturas Pendientes',
                  value: '7',
                  subtitle: 'Requiere atención',
                  subtitleColor: Colors.red,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Gráfico de ventas con título
            Card(
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          'Ventas de la semana',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    Container(
                      height: 150,
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF4CD964), // Verde claro
                            Color(0xFF007AFF), // Azul iOS
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.all(Radius.circular(8)),
                      ),
                      child: const Center(
                        child: Text(
                          'Gráfico de Ventas',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Productos más vendidos
            Card(
              color: Colors.white,
              child: Column(
                children: const [
                  ListTile(
                    title: Text(
                      'Productos Más Vendidos',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  ListTile(
                    title: Text('Laptop HP 15"'),
                    trailing: Text('125 vendidos'),
                  ),
                  ListTile(
                    title: Text('Monitor Samsung 24"'),
                    trailing: Text('98 vendidos'),
                  ),
                  ListTile(
                    title: Text('Mouse Logitech'),
                    trailing: Text('87 vendidos'),
                  ),
                  ListTile(
                    title: Text('Teclado Mecánico'),
                    trailing: Text('65 vendidos'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Alertas de Inventario
            Card(
              color: Colors.white,
              child: Column(
                children: const [
                  ListTile(
                    title: Text(
                      'Alertas de Inventario',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  _InventoryAlert(
                    product: 'Mouse Inalámbrico',
                    status: 'Stock crítico (2)',
                    color: Colors.redAccent,
                    minimo: 10,
                  ),
                  _InventoryAlert(
                    product: 'Pantalla Táctil',
                    status: 'Stock bajo (8)',
                    color: Colors.yellowAccent,
                    minimo: 15,
                  ),
                  _InventoryAlert(
                    product: 'Cable HDMI',
                    status: 'Sin stock',
                    color: Colors.redAccent,
                    minimo: 25,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Acciones Rápidas con título
            Card(
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          'Acciones Rápidas',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    Row(
                      children: const [
                        _ActionButton(label: 'Nueva Venta'),
                        SizedBox(width: 10),
                        _ActionButton(label: 'Nuevo Producto'),
                      ],
                    ),

                    const SizedBox(height: 5),

                    Row(
                      children: const [
                        _ActionButton(label: 'Nueva Factura'),
                        SizedBox(width: 10),
                        _ActionButton(label: 'Reportes'),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: const [
                        _ActionButton(label: 'Añadir Rol'),
                        SizedBox(width: 10),
                        _ActionButton(label: 'Añadir Empleado'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color? subtitleColor;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(title, style: const TextStyle(fontSize: 14)),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(color: subtitleColor ?? Colors.green),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InventoryAlert extends StatelessWidget {
  final String product;
  final String status;
  final Color color;
  final int minimo;

  const _InventoryAlert({
    required this.product,
    required this.status,
    required this.color,
    required this.minimo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: color.withOpacity(0.3),
      child: ListTile(
        title: Text('$product - $status'),
        trailing: Text('Mínimo: $minimo'),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;

  const _ActionButton({required this.label});

  @override
  Widget build(BuildContext context) {
    // Usamos el espacio disponible con el widget Expanded y un ajuste adecuado del ancho
    return Expanded(
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFF45a049), // Color de fondo del botón
          foregroundColor: Colors.white, // Color del texto del botón
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(
              10,
            ), // Radio del borde (ajustable)
          ),
        ),

        onPressed: () {},
        child: Text(label),
      ),
    );
  }
}
