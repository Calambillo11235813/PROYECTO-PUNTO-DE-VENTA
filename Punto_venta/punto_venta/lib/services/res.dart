import 'dart:convert';
import 'package:http/http.dart' as http;

main() async {
  var url = Uri.parse('http://127.0.0.1:8000/accounts/usuarios/'); // URL de tu API

  // Datos que vas a enviar
  var datos = {
    "correo": "usuario12aa2@example.com",
    "nombre": "Juan Perez",
    "fecha_de_nacimiento": "1990-01-01",
    "genero": "M",
    "direccion": "Calle Ficticia 123, Ciudad, País",
    "estado": true,
    "rol": 1,
    "empresa_id": 1,
    "password": "contraseñaSegura123"
  };

  try {
    var response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json', // Indica que envías JSON
      },
      body: jsonEncode(datos), // Convierte datos a JSON
    );

    print('Código de respuesta: ${response.statusCode}');
    print('Respuesta del servidor: ${response.body}');

    if (response.statusCode == 201) {
      print('✅ Usuario creado correctamente');
    } else {
      print('❌ Error al crear usuario');
    }
  } catch (e) {
    print('❌ Error de conexión: $e');
  }
}
