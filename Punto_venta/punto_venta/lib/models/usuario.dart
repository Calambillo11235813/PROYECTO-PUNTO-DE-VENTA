import 'dart:convert';

Usuario usuarioFromJson(String str) => Usuario.fromJson(json.decode(str));

String usuarioToJson(Usuario data) => json.encode(data.toJson());

class Usuario {
  String correo;
  String nombre;
  String direccion;
  bool estado;
  DateTime fechaExpiracion;
  String plan;
  String nombreEmpresa;
  String nitEmpresa;
  String password;

  Usuario({
    required this.correo,
    required this.nombre,
    required this.direccion,
    required this.estado,
    required this.fechaExpiracion,
    required this.plan,
    required this.nombreEmpresa,
    required this.nitEmpresa,
    required this.password,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
    correo: json["correo"],
    nombre: json["nombre"],
    direccion: json["direccion"],
    estado: json["estado"],
    fechaExpiracion: DateTime.parse(json["fecha_expiracion"]),
    plan: json["plan"],
    nombreEmpresa: json["nombre_empresa"],
    nitEmpresa: json["nit_empresa"],
    password: json["password"],
  );

  Map<String, dynamic> toJson() => {
    "correo": correo,
    "nombre": nombre,
    "direccion": direccion,
    "estado": estado,
    "fecha_expiracion":
        "${fechaExpiracion.year.toString().padLeft(4, '0')}-${fechaExpiracion.month.toString().padLeft(2, '0')}-${fechaExpiracion.day.toString().padLeft(2, '0')}",
    "plan": plan,
    "nombre_empresa": nombreEmpresa,
    "nit_empresa": nitEmpresa,
    "password": password,
  };
}
