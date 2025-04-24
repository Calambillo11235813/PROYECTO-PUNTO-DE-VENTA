// lib/screens/panel.dart
import 'package:flutter/material.dart';
import '../widgets/clients_widget.dart';
import '../widgets/inventory_widget.dart';

/// Esta pantalla muestra un layout de dos columnas:
///  - Columna izquierda: un menú para seleccionar Clientes o Inventario.
///  - Columna derecha: el contenido correspondiente.
class Panel extends StatefulWidget {
  const Panel({super.key});

  @override
  State<Panel> createState() => _PanelState();
}

class _PanelState extends State<Panel> {
  // Variable para controlar qué contenido se muestra en la parte derecha.
  // 0 para Clientes, 1 para Inventario.
  int selectedIndex = 0;

  // Opciones del menú lateral.
  final List<String> options = ['Clientes', 'Inventario'];

  @override
  Widget build(BuildContext context) {
    // Widget que muestra el menú lateral.
    Widget sideMenu = Container(
      width: 200,
      color: Colors.grey[200],
      child: ListView.builder(
        itemCount: options.length,
        itemBuilder: (context, index) {
          return ListTile(
            title: Text(options[index]),
            selected: selectedIndex == index,
            onTap: () {
              setState(() {
                selectedIndex = index;
              });
            },
          );
        },
      ),
    );

    // Widget que muestra el contenido en función del menú seleccionado.
    Widget panelContent;
    if (selectedIndex == 0) {
      panelContent = const ClientsWidget();
    } else {
      panelContent = const InventoryWidget();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Panel de Gestión')),
      body: Row(children: [sideMenu, Expanded(child: panelContent)]),
    );
  }
}
