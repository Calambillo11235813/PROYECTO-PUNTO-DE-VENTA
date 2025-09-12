class Empresa {
  final int id;
  final String nombre;
  final String nit;
  final bool estado;

  Empresa({
    required this.id,
    required this.nombre,
    required this.nit,
    required this.estado,
  });

  // Factory constructor para convertir de JSON a un objeto Empresa
  factory Empresa.fromJson(Map<String, dynamic> json) {
    return Empresa(
      id: json['id'],
      nombre: json['nombre'],
      nit: json['nit'],
      estado: json['estado'],
    );
  }

  // Método para convertir de un objeto Empresa a JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'nit': nit,
      'estado': estado,
    };
  }
}