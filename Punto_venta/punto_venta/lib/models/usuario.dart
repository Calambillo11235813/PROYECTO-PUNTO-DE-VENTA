import 'dart:convert';

Usuario usuarioFromJson(String str) => Usuario.fromJson(json.decode(str));

String usuarioToJson(Usuario data) => json.encode(data.toJson());

class Usuario {
    String correo;
    String nombre;
    DateTime fechaDeNacimiento;
    String genero;
    String direccion;
    bool estado;
    int rol;
    int empresaId;
    String password;

    Usuario({
        required this.correo,
        required this.nombre,
        required this.fechaDeNacimiento,
        required this.genero,
        required this.direccion,
        required this.estado,
        required this.rol,
        required this.empresaId,
        required this.password,
        
    });

    factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
        correo: json["correo"],
        nombre: json["nombre"],
        fechaDeNacimiento: DateTime.parse(json["fecha_de_nacimiento"]),
        genero: json["genero"],
        direccion: json["direccion"],
        estado: json["estado"],
        rol: json["rol"],
        empresaId: json["empresa_id"],
        password: json["password"],
    );

    Map<String, dynamic> toJson() => {
        "correo": correo,
        "nombre": nombre,
        "fecha_de_nacimiento": "${fechaDeNacimiento.year.toString().padLeft(4, '0')}-${fechaDeNacimiento.month.toString().padLeft(2, '0')}-${fechaDeNacimiento.day.toString().padLeft(2, '0')}",
        "genero": genero,
        "direccion": direccion,
        "estado": estado,
        "rol": rol,
        "empresa_id": empresaId, // Asegúrate que el nombre del campo coincida con lo que espera tu API
        "password": password,
    };
}