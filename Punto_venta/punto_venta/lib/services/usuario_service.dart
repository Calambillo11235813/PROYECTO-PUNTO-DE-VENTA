import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/usuario.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

class UsuarioService {
  static const String _baseUrl = 'http://10.0.2.2:8000/accounts';
  
  // Clave de encriptación - considera almacenarla de forma más segura
  static final _encryptionKey = encrypt.Key.fromLength(32); // 256 bits
  static final _iv = encrypt.IV.fromLength(16);  // 128 bits
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



  

  static Future<bool> crearUsuario(Usuario usuario) async {
    // Código existente sin cambios
    final url = Uri.parse('$_baseUrl/usuarios/');

    try {
      final usuarioJson = usuario.toJson();
    
      usuarioJson['empresa_id'] = 1;
      


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
static Future<bool> loginUsuario(String correo, String password) async {
  final url = Uri.parse('$_baseUrl/login/');

  try {
    final Map<String, dynamic> loginData = {
      'correo': correo,
      'password': password,
    };

    print('URL de la petición: $url');
    print('Datos enviados: ${jsonEncode(loginData)}');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(loginData),
    );

    print('Código de respuesta: ${response.statusCode}');
    print('Cuerpo de respuesta: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      // Guardar todo el cuerpo de la respuesta de forma encriptada
      await _saveEncrypted('login_response', response.body);

      // Guardar tokens y datos de empresa de forma encriptada
      await _saveEncrypted('access_token', data['access']);
      await _saveEncrypted('refresh_token', data['refresh']);

      final empresa = data['empresa'];
      if (empresa != null) {
        await _saveEncrypted('empresa_id', empresa['id'].toString());
        await _saveEncrypted('empresa_nombre', empresa['nombre']);
        await _saveEncrypted('empresa_nit', empresa['nit']);
      }

      print('✅ Login exitoso y datos guardados de forma segura (encriptados)');
      return true;
    } else {
      print('❌ Error en login: ${response.statusCode}');
      print('Respuesta: ${response.body}');
      return false;
    }
  } catch (e) {
    print('❌ Error de conexión: $e');
    return false;
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

  static Future<Map<String, dynamic>?> getLoginResponse() async {
  final encryptedResponse = await _getEncrypted('login_response');
  
  if (encryptedResponse != null) {
    // Desencriptar y convertir a Map
    final decryptedResponse = jsonDecode(encryptedResponse);
    return decryptedResponse;
  }
  
  return null; // Si no se encuentra respuesta almacenada
}


}


