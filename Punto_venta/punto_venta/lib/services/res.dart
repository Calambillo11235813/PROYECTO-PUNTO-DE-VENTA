import 'dart:convert'; // 👈 Necesario para usar jsonDecode
import 'package:http/http.dart' as http;
import 'package:punto_venta/global/global_storage.dart';

main() async {
  var response = await http.post(
    Uri.parse(GlobalStorage.url + 'accounts/usuarios/'),
  ); // Llamada HTTP
  print('Respuesta cruda: ${response.body}'); // Solo para debug

  // Convertir el body a JSON
  var datos = jsonDecode(response.body);

  // Ahora datos es una lista o mapa de Dart
  print('Datos decodificados:');
  print(datos);

  // Si quieres recorrerlo como lista:
  if (datos is List) {
    for (var usuario in datos) {
      print('Nombre: ${usuario['nombre']} - Correo: ${usuario['correo']}');
    }
  }
}
