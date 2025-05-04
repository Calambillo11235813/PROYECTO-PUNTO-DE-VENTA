import 'dart:convert'; // 👈 Necesario para usar jsonDecode
import 'package:http/http.dart' as http;

main() async {
  var response = await http.get(Uri.parse('http://127.0.0.1:8000/accounts/usuarios/')); // Llamada HTTP
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