import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:punto_venta/global/global_storage.dart';

Future<String?> modificarUsuario({
  required String nombre,
  required String correo,
  required String password,
  required String nombreEmpresa,
  required String direccion,
  required String nitEmpresa,
}) async {
  final int idUsuario = GlobalStorage.userId ?? 0;
  final url = Uri.parse(GlobalStorage.url + 'accounts/usuarios/$idUsuario/');

  final Map<String, dynamic> body = {
    "nombre": nombre,
    "correo": correo,
    "password": password,
    "nombre_empresa": nombreEmpresa,
    "direccion": direccion,
    "nit_empresa": nitEmpresa,
  };

  try {
    final response = await http.put(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> responseData = jsonDecode(response.body);
      print('✅ Usuario modificado exitosamente: ${responseData["nombre"]}');
      return null; // Todo bien
    } else {
      print('❌ Error al modificar usuario: ${response.statusCode}');
      print('Mensaje: ${response.body}');

      final responseData = jsonDecode(response.body);

      if (responseData is Map<String, dynamic>) {
        if (responseData.containsKey('correo')) {
          return 'Este correo se encuentra en uso.';
        } else if (responseData.containsKey('nit_empresa')) {
          return 'Este NIT se encuentra en uso.';
        }
      }

      return 'Error al guardar los cambios.';
    }
  } catch (e) {
    print('⚠️ Error de conexión o procesamiento: $e');
    return 'Error de conexión con el servidor.';
  }
}

class ConfiguracionScreen extends StatefulWidget {
  const ConfiguracionScreen({super.key});

  @override
  State<ConfiguracionScreen> createState() => _ConfiguracionScreenState();
}

class _ConfiguracionScreenState extends State<ConfiguracionScreen> {
  final TextEditingController nombreController = TextEditingController();
  final TextEditingController correoController = TextEditingController();
  final TextEditingController nombreEmpresaController = TextEditingController();
  final TextEditingController nitEmpresaController = TextEditingController();
  final TextEditingController direccionController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmarPasswordController =
      TextEditingController();

  Future<void> guardarCambios() async {
    if (passwordController.text != confirmarPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Las contraseñas no coinciden.",
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: Color(0xFF45a049),
        ),
      );
      return;
    }

    final mensajeError = await modificarUsuario(
      nombre: nombreController.text,
      correo: correoController.text,
      password: passwordController.text,
      nombreEmpresa: nombreEmpresaController.text,
      direccion: direccionController.text,
      nitEmpresa: nitEmpresaController.text,
    );

    if (mensajeError == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Cambios guardados exitosamente.",
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: Color(0xFF45a049),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            mensajeError,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: Color(0xFF45a049),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Configuración',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              const SizedBox(height: 10),
              const Text(
                "Esta información se utiliza para identificarte en el sistema y las comunicaciones.",
              ),
              const SizedBox(height: 10),
              TextField(
                controller: nombreController,
                decoration: const InputDecoration(
                  labelText: 'Nombre Completo',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: correoController,
                decoration: const InputDecoration(
                  labelText: 'Correo Electrónico',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Esta información aparecerá en facturas y documentos generados por el sistema.",
              ),
              const SizedBox(height: 10),
              TextField(
                controller: nombreEmpresaController,
                decoration: const InputDecoration(
                  labelText: 'Nombre de la Empresa',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nitEmpresaController,
                decoration: const InputDecoration(
                  labelText: 'NIT / Identificación Fiscal',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: direccionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Dirección',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Recomendamos usar contraseñas seguras y cambiarlas regularmente para mantener la seguridad de su cuenta.',
                style: TextStyle(color: Color.fromARGB(255, 63, 63, 63)),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Nueva Contraseña',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: confirmarPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Confirmar Nueva Contraseña',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.save, color: Colors.white),
                  label: const Text(
                    "Guardar cambios",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF45a049),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 60,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: guardarCambios,
                ),
              ),
              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }
}
