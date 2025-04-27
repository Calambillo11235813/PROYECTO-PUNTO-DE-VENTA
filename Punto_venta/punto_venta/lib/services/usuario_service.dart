
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/usuario.dart';

class UsuarioService {
  // Cambia esta URL por la de tu backend
  static const String _baseUrl = 'http://10.0.2.2:8000/accounts';

  static Future<bool> crearUsuario(Usuario usuario) async {
    final url = Uri.parse('$_baseUrl/usuarios/');

    try {
      // Convertir el usuario a JSON
      final usuarioJson = usuario.toJson();
      print('usuarioJson: ${usuarioJson}');
     
      // Asegurarse de que empresaId esté presente
      usuarioJson['empresa_id'] = 1;
      
      // Imprimir datos para debug
      print('URL de la petición: $url');
      print('Datos enviados: ${jsonEncode(usuarioJson)}');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(usuarioJson),
      );

      print('Código de respuesta: ${response.statusCode}');
      print('Cuerpo de respuesta: ${response.body}');

      if (response.statusCode == 201) {
        print('✅ Usuario creado correctamente');
        return true;
      } else {
        print('❌ Error al crear usuario: ${response.statusCode}');
        print('Respuesta: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error de conexión: $e');
      return false;
    }
  }


  static Future<bool> loginUsuario(Usuario usuario) async {
    final url = Uri.parse('$_baseUrl/usuarios/');

    try {
      // Convertir el usuario a JSON
      final usuarioJson = usuario.toJson();
      print('usuarioJson: ${usuarioJson}');
     
      // Asegurarse de que empresaId esté presente
      usuarioJson['empresa_id'] = 1;
      
      // Imprimir datos para debug
      print('URL de la petición: $url');
      print('Datos enviados: ${jsonEncode(usuarioJson)}');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(usuarioJson),
      );

      print('Código de respuesta: ${response.statusCode}');
      print('Cuerpo de respuesta: ${response.body}');

      if (response.statusCode == 201) {
        print('✅ Usuario creado correctamente');
        return true;
      } else {
        print('❌ Error al crear usuario: ${response.statusCode}');
        print('Respuesta: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error de conexión: $e');
      return false;
    }
  }
}
