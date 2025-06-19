import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/usuario.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:punto_venta/global/global_storage.dart';

class UsuarioService {
  // Clave de encriptación - considera almacenarla de forma más segura
  static final _encryptionKey = encrypt.Key.fromLength(32); // 256 bits
  static final _iv = encrypt.IV.fromLength(16); // 128 bits
  static final _encrypter = encrypt.Encrypter(encrypt.AES(_encryptionKey));

  // Método para encriptar datos
  static String _encryptData(String data) {
    final encrypted = _encrypter.encrypt(data, iv: _iv);
    return encrypted.base64;
  }

  // Método para desencriptar datos
  static String _decryptData(String encryptedData) {
    final encrypted = encrypt.Encrypted.fromBase64(encryptedData);
    return _encrypter.decrypt(encrypted, iv: _iv);
  }

  // Métodos para guardar y obtener datos encriptados
  static Future<void> _saveEncrypted(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    final encryptedValue = _encryptData(value);
    await prefs.setString(key, encryptedValue);
  }

  static Future<String?> _getEncrypted(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final encryptedValue = prefs.getString(key);
    if (encryptedValue == null) return null;
    return _decryptData(encryptedValue);
  }

  static Future<String?> crearUsuario(Usuario usuario) async {
    final url = Uri.parse(GlobalStorage.url + 'accounts/usuarios/');

    try {
      final usuarioJson = {
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "direccion": usuario.direccion,
        "estado": usuario.estado,
        "fecha_expiracion":
            usuario.fechaExpiracion.toIso8601String().split('T')[0],
        "plan": usuario.plan,
        "nombre_empresa": usuario.nombreEmpresa,
        "nit_empresa": usuario.nitEmpresa,
        "password": usuario.password,
      };

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(usuarioJson),
      );

      print('Código de respuesta: ${response.statusCode}');
      print('Cuerpo de respuesta: ${response.body}');

      if (response.statusCode == 201) {
        print('✅ Usuario creado correctamente');
        return null; // null indica éxito
      } else {
        final responseData = jsonDecode(response.body);
        // Suponiendo que el backend devuelve un mapa de errores
        if (responseData is Map<String, dynamic>) {
          if (responseData.containsKey('correo')) {
            return 'Este correo se encuentra en uso.';
          } else if (responseData.containsKey('nit_empresa')) {
            return 'Este NIT se encuentra en uso.';
          }
        }
        return 'Error en el registro';
      }
    } catch (e) {
      print('❌ Error de conexión: $e');
      return 'Error de conexión con el servidor';
    }
  }

  static Future<String?> loginUsuario(String correo, String password) async {
    final url = Uri.parse(GlobalStorage.url + 'accounts/login/');

    try {
      final Map<String, dynamic> loginData = {
        'correo': correo,
        'password': password,
      };

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(loginData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['usuario'] != null) {
          GlobalStorage.userId = data['usuario']['id'];
          await _saveEncrypted('access_token', data['access']);
          await _saveEncrypted('refresh_token', data['refresh']);
          return 'usuario';
        } else if (data['empleado'] != null) {
          GlobalStorage.userId = data['empleado']['id'];
          return data['empleado']['rol'];
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // Métodos para acceder a los datos guardados
  static Future<String?> getToken() async {
    return await _getEncrypted('access_token');
  }

  static Future<String?> getRefreshToken() async {
    return await _getEncrypted('refresh_token');
  }

  static Future<Map<String, String?>> getEmpresaData() async {
    return {
      'id': await _getEncrypted('empresa_id'),
      'nombre': await _getEncrypted('empresa_nombre'),
      'nit': await _getEncrypted('empresa_nit'),
    };
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('empresa_id');
    await prefs.remove('empresa_nombre');
    await prefs.remove('empresa_nit');
  }

  static Future<List<Usuario>> mostrarCliente() async {
    // Obtener los datos de la empresa de manera asincrónica
    final empresaData = await getEmpresaData();
    final empresaId = empresaData['id'];

    if (empresaId == null) {
      print('❌ No se pudo obtener el ID de la empresa');
      return [];
    }

    final url = Uri.parse(
      GlobalStorage.url + 'accounts/usuarios/clientes/$empresaId/',
    );

    try {
      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      print('Código de respuesta: ${response.statusCode}');
      print('Cuerpo de respuesta: ${response.body}');

      if (response.statusCode == 200) {
        // Decodificar la respuesta JSON
        final List<dynamic> responseData = jsonDecode(response.body);

        // Convertir los datos a una lista de objetos Usuario
        List<Usuario> clientes =
            responseData.map((json) {
              return Usuario.fromJson(
                json,
              ); // Asegúrate de que el modelo Usuario tenga un método `fromJson`
            }).toList();

        print('✅ Clientes obtenidos correctamente');
        return clientes;
      } else {
        print('❌ Error al obtener clientes: ${response.statusCode}');
        print('Respuesta: ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Error de conexión: $e');
      return [];
    }
  }

  static Future<bool> crearCliente(Usuario usuario) async {
    // Código existente sin cambios
    final url = Uri.parse(GlobalStorage.url + 'accounts/usuarios/');

    try {
      final usuarioJson = usuario.toJson();

      usuarioJson['rol_id'] = 3;

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
