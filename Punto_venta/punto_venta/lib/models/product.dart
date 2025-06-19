class Categoria2 {
  final int id;
  final String nombre;
  // Si quieres, puedes agregar el usuario también, pero no es necesario para mostrar nombre.
  // final int usuarioId;

  Categoria2({required this.id, required this.nombre});

  factory Categoria2.fromJson(Map<String, dynamic> json) {
    return Categoria2(
      id: json['id'],
      nombre: json['nombre'],
      // usuarioId: json['usuario'], // opcional
    );
  }
}

class Usuario {
  final int id;
  final String nombre;
  final String correo;
  final String? fechaExpiracion;
  final String? plan;
  final String direccion;
  final bool estado;
  final String nombreEmpresa;
  final String nitEmpresa;
  final bool isStaff;

  Usuario({
    required this.id,
    required this.nombre,
    required this.correo,
    this.fechaExpiracion,
    this.plan,
    required this.direccion,
    required this.estado,
    required this.nombreEmpresa,
    required this.nitEmpresa,
    required this.isStaff,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'],
      nombre: json['nombre'],
      correo: json['correo'],
      fechaExpiracion: json['fecha_expiracion'],
      plan: json['plan'],
      direccion: json['direccion'],
      estado: json['estado'],
      nombreEmpresa: json['nombre_empresa'],
      nitEmpresa: json['nit_empresa'],
      isStaff: json['is_staff'],
    );
  }
}

class Producto {
  final int id;
  final String nombre;
  final String precioCompra;
  final String precioVenta;
  final String descripcion;
  final String? imagenUrl;
  final int stock;
  final Usuario usuario;
  final Categoria2? categoria; // nuevo campo categoría

  Producto({
    required this.id,
    required this.nombre,
    required this.precioCompra,
    required this.precioVenta,
    required this.descripcion,
    this.imagenUrl,
    required this.stock,
    required this.usuario,
    this.categoria,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'],
      nombre: json['nombre'],
      precioCompra: json['precio_compra'],
      precioVenta: json['precio_venta'],
      descripcion: json['descripcion'],
      imagenUrl: json['imagen_url'],
      stock: json['stock'],
      usuario: Usuario.fromJson(json['usuario']),
      categoria:
          json['categoria'] != null
              ? Categoria2.fromJson(json['categoria'])
              : null,
    );
  }
}
