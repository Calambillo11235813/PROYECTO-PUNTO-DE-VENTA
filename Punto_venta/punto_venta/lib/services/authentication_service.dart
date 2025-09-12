// lib/services/authentication_service.dart
import 'dart:async';

class AuthenticationService {
  // Función simulada de autenticación
  static Future<bool> login(String email, String password) async {
    // Simula un retardo para imitar una llamada a servidor
    await Future.delayed(Duration(seconds: 2));

    // Ejemplo simple: si el correo es "admin@admin.com" y la contraseña "123456", devuelve éxito
    if (email == 'admin@admin.com' && password == '123456') {
      return true;
    }
    return false;
  }


  static Future<bool> registro(String email, String password) async {
    // Simula un retardo para imitar una llamada a servidor
    await Future.delayed(Duration(seconds: 2));

    // Ejemplo simple: si el correo es "admin@admin.com" y la contraseña "123456", devuelve éxito
    if (email == 'admin@admin.com' && password == '123456') {
      return true;
    }
    return false;
  }

  
  static register(String trim, String trim2, String trim3) {}
}
