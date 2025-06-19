import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:punto_venta/global/global_storage.dart';

class EmpleadoScreen extends StatefulWidget {
  const EmpleadoScreen({super.key});

  @override
  State<EmpleadoScreen> createState() => _EmpleadoScreenState();
}

class _EmpleadoScreenState extends State<EmpleadoScreen> {
  List empleados = [];
  Map<int, String> rolesMostrar = {};
  Map<int, String> rolesRegistro = {};
  Map<int, String> rolesModificar = {};

  @override
  void initState() {
    super.initState();
    fetchEmpleadosYRoles();
  }

  Future<void> fetchEmpleadosYRoles() async {
    final userId = GlobalStorage.userId;
    final empleadosResponse = await http.get(
      Uri.parse(GlobalStorage.url + 'accounts/empleados/$userId/'),
    );
    final rolesResponse = await http.get(
      Uri.parse(GlobalStorage.url + 'accounts/roles/'),
    );

    if (empleadosResponse.statusCode == 200 &&
        rolesResponse.statusCode == 200) {
      final empleadosData = json.decode(empleadosResponse.body);
      final rolesData = json.decode(rolesResponse.body);

      Map<int, String> roles = {
        for (var r in rolesData) r['id'] as int: r['nombre_rol'] as String,
      };

      for (var emp in empleadosData) {
        final rolId = emp['rol'];
        emp['rol'] = roles[rolId] ?? 'Desconocido';
      }

      setState(() {
        empleados = empleadosData;

        rolesMostrar = roles;

        rolesRegistro = {
          for (var r in rolesData)
            if (r['nombre_rol'] != 'admin')
              r['id'] as int: r['nombre_rol'] as String,
        };

        rolesModificar = {
          for (var r in rolesData)
            if (r['nombre_rol'] != 'admin')
              r['id'] as int: r['nombre_rol'] as String,
        };
      });
    }
  }

  Future<void> eliminarEmpleado(int usuarioId, int empleadoId) async {
    final response = await http.delete(
      Uri.parse(
        '${GlobalStorage.url}accounts/empleado/$usuarioId/$empleadoId/',
      ),
    );

    if (response.statusCode == 200) {
      // Muestra SnackBar primero
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Empleado eliminado correctamente')),
      );

      // Luego recarga los empleados desde el servidor
      await fetchEmpleadosYRoles(); // <- Esta es la clave

      if (mounted) {
        setState(() {}); // Refresca la UI con la lista actualizada
      }
    } else {
      print('Error al eliminar: ${response.body}');
    }
  }

  Future<void> mostrarModalModificar(Map emp) async {
    final TextEditingController nombreCtrl = TextEditingController(
      text: emp['nombre'],
    );
    final TextEditingController correoCtrl = TextEditingController(
      text: emp['correo'],
    );
    final TextEditingController telefonoCtrl = TextEditingController(
      text: emp['telefono'],
    );
    final TextEditingController direccionCtrl = TextEditingController(
      text: emp['direccion'],
    );
    final TextEditingController fechaCtrl = TextEditingController(
      text: emp['fecha_contratacion'] ?? '',
    );
    bool estado = emp['estado'];

    int rolSeleccionado =
        rolesModificar.entries
            .firstWhere(
              (entry) => entry.value == emp['rol'],
              orElse: () => MapEntry(0, 'Desconocido'),
            )
            .key;

    await showModalBottomSheet(
      context: context,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Modificar Empleado',
                      style: TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF45a049),
                      ),
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      controller: nombreCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nombre',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: correoCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Correo',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: telefonoCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Teléfono',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: direccionCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Dirección',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: fechaCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Fecha de contratación',
                        border: OutlineInputBorder(),
                      ),
                      readOnly: true,
                      onTap: () async {
                        DateTime? picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          fechaCtrl.text =
                              picked.toIso8601String().split('T')[0];
                        }
                      },
                    ),
                    const SizedBox(height: 10),

                    DropdownButtonFormField<int>(
                      value: rolSeleccionado,
                      items:
                          rolesModificar.entries
                              .map(
                                (e) => DropdownMenuItem(
                                  value: e.key,
                                  child: Text(e.value),
                                ),
                              )
                              .toList(),
                      onChanged:
                          (val) => setModalState(() => rolSeleccionado = val!),
                      decoration: const InputDecoration(
                        labelText: 'Rol',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),

                    InputDecorator(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Estado',
                            style: TextStyle(
                              fontSize: 16.5,
                              color: Color.fromARGB(171, 0, 0, 0),
                            ),
                          ),
                          Switch(
                            value: estado,
                            activeColor: const Color(0xFF45a049),
                            inactiveThumbColor: const Color.fromARGB(
                              255,
                              104,
                              161,
                              107,
                            ),
                            onChanged:
                                (val) => setModalState(() => estado = val),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF45a049),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 11),
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final response = await http.put(
                                Uri.parse(
                                  '${GlobalStorage.url}accounts/empleado/${GlobalStorage.userId}/${emp['id']}/',
                                ),
                                headers: {'Content-Type': 'application/json'},
                                body: jsonEncode({
                                  'nombre': nombreCtrl.text,
                                  'correo': correoCtrl.text,
                                  'telefono': telefonoCtrl.text,
                                  'direccion': direccionCtrl.text,
                                  'estado': estado,
                                  'fecha_contratacion': fechaCtrl.text,
                                  'rol': rolesModificar[rolSeleccionado],
                                }),
                              );

                              Future.microtask(() {
                                if (response.statusCode == 200) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Empleado modificado exitosamente',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      backgroundColor: Color(0xFF45a049),
                                    ),
                                  );
                                  fetchEmpleadosYRoles();
                                } else {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Este correo se encuentra en uso.',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.red,
                                        ),
                                      ),
                                      backgroundColor: Color.fromARGB(
                                        255,
                                        255,
                                        255,
                                        255,
                                      ),
                                    ),
                                  );
                                }
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF45a049),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 11),
                            ),
                            child: const Text(
                              'Modificar',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 50),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> mostrarModalRegistro() async {
    final TextEditingController nombreCtrl = TextEditingController();
    final TextEditingController correoCtrl = TextEditingController();
    final TextEditingController passwordCtrl = TextEditingController();
    final TextEditingController telefonoCtrl = TextEditingController();
    final TextEditingController direccionCtrl = TextEditingController();
    final TextEditingController fechaCtrl = TextEditingController();

    final _formKey = GlobalKey<FormState>();

    int? rolSeleccionado =
        rolesRegistro.isNotEmpty ? rolesRegistro.keys.first : null;

    // Captura el contexto padre para el SnackBar
    final rootContext = context;

    await showModalBottomSheet(
      context: context,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 16,
            left: 16,
            right: 16,
          ),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Registrar Empleado',
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF45a049),
                        ),
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: nombreCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nombre',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: correoCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Correo',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: passwordCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Contraseña',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: telefonoCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Teléfono',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: direccionCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Dirección',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: fechaCtrl,
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: 'Fecha de contratación',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null || value.isEmpty
                                    ? 'Campo requerido'
                                    : null,
                        onTap: () async {
                          FocusScope.of(context).requestFocus(FocusNode());
                          DateTime? picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                          );
                          if (picked != null) {
                            fechaCtrl.text =
                                picked.toIso8601String().split('T')[0];
                          }
                        },
                      ),
                      const SizedBox(height: 10),

                      DropdownButtonFormField<int>(
                        value: rolSeleccionado,
                        items:
                            rolesRegistro.entries
                                .map(
                                  (e) => DropdownMenuItem(
                                    value: e.key,
                                    child: Text(e.value),
                                  ),
                                )
                                .toList(),
                        onChanged:
                            (val) => setModalState(() => rolSeleccionado = val),
                        decoration: const InputDecoration(
                          labelText: 'Rol',
                          border: OutlineInputBorder(),
                        ),
                        validator:
                            (value) =>
                                value == null ? 'Selecciona un rol' : null,
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                if (!_formKey.currentState!.validate()) return;

                                final bodyData = {
                                  'nombre': nombreCtrl.text,
                                  'correo': correoCtrl.text,
                                  'password': passwordCtrl.text,
                                  'telefono': telefonoCtrl.text,
                                  'direccion': direccionCtrl.text,
                                  'fecha_contratacion': fechaCtrl.text,
                                  'rol': rolesRegistro[rolSeleccionado],
                                };

                                final response = await http.post(
                                  Uri.parse(
                                    '${GlobalStorage.url}accounts/empleados/${GlobalStorage.userId}/',
                                  ),
                                  headers: {'Content-Type': 'application/json'},
                                  body: jsonEncode(bodyData),
                                );

                                Future.microtask(() {
                                  final body = response.body;

                                  if (response.statusCode == 201) {
                                    // Éxito: empleado registrado
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(
                                      rootContext,
                                    ).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Empleado registrado exitosamente',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        backgroundColor: Color(0xFF45a049),
                                      ),
                                    );
                                    fetchEmpleadosYRoles();
                                  } else {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(
                                      rootContext,
                                    ).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Este correo se encuentra en uso.',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.red,
                                          ),
                                        ),
                                        backgroundColor: Color.fromARGB(
                                          255,
                                          255,
                                          255,
                                          255,
                                        ),
                                      ),
                                    );
                                  }
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF45a049),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 11,
                                ),
                              ),
                              child: const Text(
                                'Registrar',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 50),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Empleados',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body:
          empleados.isEmpty
              ? const Center(
                child: Text(
                  "No hay empleados registrados",
                  style: TextStyle(fontSize: 16, color: Colors.black54),
                ),
              )
              : ListView.separated(
                itemCount: empleados.length + 1,
                separatorBuilder: (_, __) => const SizedBox(height: 13),
                itemBuilder: (context, index) {
                  // Si es el primer índice, muestra un espacio (20 px) arriba
                  if (index == 0) {
                    return const SizedBox(
                      height: 0,
                    ); // Espacio entre AppBar y la primera tarjeta
                  }

                  final emp = empleados[index - 1]; // Ajustar el índice
                  final rolNombre = emp['rol'] ?? 'Desconocido';
                  final estado = emp['estado'] ? 'Activo' : 'Inactivo';
                  final estadoColor =
                      emp['estado']
                          ? const Color.fromARGB(255, 84, 196, 88)
                          : Colors.red;

                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 10),
                    child: ListTile(
                      title: Text(
                        emp['nombre'],
                        style: const TextStyle(
                          color: Color(0xFF45a049),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Correo: ${emp['correo']}'),
                          Text('Teléfono: ${emp['telefono']}'),
                          Text('Rol: $rolNombre'),
                          Text(
                            'Estado: $estado',
                            style: TextStyle(color: estadoColor),
                          ),
                        ],
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () => mostrarModalModificar(emp),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () {
                              final parentContext =
                                  context; // Guarda el contexto principal

                              showDialog(
                                context: parentContext,
                                builder: (context) {
                                  return AlertDialog(
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    backgroundColor: const Color.fromARGB(
                                      255,
                                      225,
                                      225,
                                      241,
                                    ),
                                    title: const Center(
                                      child: Text(
                                        'Confirmar eliminación',
                                        style: TextStyle(
                                          color: Color(0xFF45a049),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 23,
                                        ),
                                      ),
                                    ),
                                    content: Text(
                                      '¿Seguro que deseas eliminar a ${emp['nombre']}?',
                                    ),
                                    actionsPadding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                      vertical: 10,
                                    ),
                                    contentPadding: const EdgeInsets.fromLTRB(
                                      24,
                                      20,
                                      24,
                                      0,
                                    ),
                                    actions: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: TextButton(
                                              onPressed:
                                                  () => Navigator.pop(context),
                                              style: TextButton.styleFrom(
                                                backgroundColor: const Color(
                                                  0xFF45a049,
                                                ),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 5,
                                                    ),
                                              ),
                                              child: const Text(
                                                'Cancelar',
                                                style: TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () async {
                                                Navigator.pop(
                                                  context,
                                                ); // cerrar solo el diálogo

                                                await eliminarEmpleado(
                                                  GlobalStorage.userId!,
                                                  emp['id'],
                                                );

                                                if (mounted) {
                                                  await fetchEmpleadosYRoles();
                                                }

                                                ScaffoldMessenger.of(
                                                  parentContext,
                                                ).showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      'Empleado ${emp['nombre']} eliminado',
                                                      style: const TextStyle(
                                                        fontSize: 15,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Colors.white,
                                                      ),
                                                    ),
                                                    backgroundColor:
                                                        const Color(0xFF45a049),
                                                  ),
                                                );
                                              },
                                              style: OutlinedButton.styleFrom(
                                                backgroundColor: Colors.white,
                                                side: BorderSide.none,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 5,
                                                    ),
                                              ),
                                              child: const Text(
                                                'Eliminar',
                                                style: TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.red,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  );
                                },
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

      floatingActionButton: FloatingActionButton(
        onPressed: mostrarModalRegistro,
        backgroundColor: const Color(0xFF45a049),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
