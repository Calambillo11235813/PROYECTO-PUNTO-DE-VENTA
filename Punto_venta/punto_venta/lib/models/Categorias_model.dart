class Categoria {
  final int id;
  final String nombre;
  final int usuario;

  Categoria({required this.id, required this.nombre, required this.usuario});

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id'],
      nombre: json['nombre'],
      usuario: json['usuario'],
    );
  }
}
