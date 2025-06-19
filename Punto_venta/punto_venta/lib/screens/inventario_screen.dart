import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:punto_venta/models/product.dart';
import 'package:punto_venta/global/global_storage.dart';
import 'package:punto_venta/models/Categorias_model.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

//----------------------------- Metodos Http---------------------------------------
Future<void> eliminarCategoria(int usuarioId, int categoriaId) async {
  final url = Uri.parse(
    '${GlobalStorage.url}productos/categoria/usuario/$usuarioId/$categoriaId/',
  );
  final response = await http.delete(url);

  if (response.statusCode != 204) {
    throw Exception('Error al eliminar categoría: ${response.statusCode}');
  }
}

Future<void> modificarProducto({
  required int productoId,
  required String nombre,
  required double precioCompra,
  required double precioVenta,
  required String descripcion,
  required int stockInicial,
  required int cantidadMinima,
  required int cantidadMaxima,
  required int categoriaId,
  File? imagen, // Puede ser null si no se cambia
}) async {
  final uri = Uri.parse(
    "${GlobalStorage.url}productos/detalles/usuario/${GlobalStorage.userId}/$productoId/",
  );

  final request = http.MultipartRequest('PUT', uri);
  request.fields['nombre'] = nombre;
  request.fields['precio_compra'] = precioCompra.toString();
  request.fields['precio_venta'] = precioVenta.toString();
  request.fields['descripcion'] = descripcion;
  request.fields['stock_inicial'] = stockInicial.toString();
  request.fields['cantidad_minima'] = cantidadMinima.toString();
  request.fields['cantidad_maxima'] = cantidadMaxima.toString();
  request.fields['categoria_id'] =
      categoriaId
          .toString(); // Asegúrate que el backend espera 'categoria', no 'categoria_id'

  if (imagen != null) {
    final imagenMultipart = await http.MultipartFile.fromPath(
      'imagen',
      imagen.path,
    );
    request.files.add(imagenMultipart);
    print('📸 Imagen añadida: ${imagen.path}');
  }

  // 🔍 Imprimir campos que se enviarán
  print('📝 Campos enviados:');
  request.fields.forEach((key, value) {
    print('  $key: $value');
  });

  // 🔍 Imprimir archivos que se enviarán
  if (request.files.isNotEmpty) {
    for (var file in request.files) {
      print('  ${file.field} => ${file.filename}');
    }
  }

  final response = await request.send();

  // 🔍 Imprimir respuesta
  final responseBody = await response.stream.bytesToString();
  print('📨 Código de respuesta: ${response.statusCode}');
  print('📨 Cuerpo de respuesta: $responseBody');

  if (response.statusCode != 200) {
    throw Exception('Error al modificar producto: ${response.statusCode}');
  }
}

Future<List<Categoria>> fetchCategoriasUsuario() async {
  final int? userId = GlobalStorage.userId;
  if (userId == null) {
    throw Exception("ID de usuario no disponible.");
  }
  final url = Uri.parse(
    '${GlobalStorage.url}productos/categoria/usuario/$userId/',
  );
  final response = await http.get(url);

  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((item) => Categoria.fromJson(item)).toList();
  } else {
    throw Exception('Error al cargar categorías: ${response.statusCode}');
  }
}

Future<void> insertarCategoria(String nombre) async {
  // completo
  final int? userId = GlobalStorage.userId;
  if (userId == null) {
    throw Exception("ID de usuario no disponible.");
  }

  final url = Uri.parse(
    GlobalStorage.url + 'productos/categoria/usuario/$userId/',
  );

  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'nombre': nombre}),
  );

  if (response.statusCode == 200 || response.statusCode == 201) {
    final data = jsonDecode(response.body);
    print('Categoría insertada: $data');
  } else {
    throw Exception('Error al insertar categoría: ${response.body}');
  }
}

Future<void> obtenerDetalleProducto({
  required int usuarioId,
  required int productoId,
}) async {
  final url = Uri.parse(
    GlobalStorage.url + 'productos/detalles/usuario/$usuarioId/$productoId/',
  );

  try {
    final response = await http.delete(
      url,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('📦 Producto: ${data['nombre']}');
      print('💵 Precio Venta: ${data['precio_venta']}');
      print('👤 Usuario: ${data['usuario']['nombre']}');
    } else {
      print('❌ Error al obtener producto: ${response.statusCode}');
    }
  } catch (e) {
    print('⚠️ Error de conexión: $e');
  }
}

Future<void> crearProductoConImagen({
  required int usuarioId,
  required String nombre,
  required double precioCompra,
  required double precioVenta,
  required String descripcion,
  required int stockInicial,
  required int cantidadMinima,
  required int cantidadMaxima,
  required int categoriaId,
  required File imagen,
}) async {
  final url = Uri.parse(
    '${GlobalStorage.url}productos/crear/usuario/$usuarioId/',
  );

  final request =
      http.MultipartRequest('POST', url)
        ..fields['nombre'] = nombre
        ..fields['precio_compra'] = precioCompra.toString()
        ..fields['precio_venta'] = precioVenta.toString()
        ..fields['descripcion'] = descripcion
        ..fields['usuario_id'] = usuarioId.toString()
        ..fields['stock_inicial'] = stockInicial.toString()
        ..fields['cantidad_minima'] = cantidadMinima.toString()
        ..fields['cantidad_maxima'] = cantidadMaxima.toString()
        ..fields['categoria_id'] = categoriaId.toString()
        ..files.add(await http.MultipartFile.fromPath('imagen', imagen.path));

  final response = await request.send();
  if (response.statusCode == 201 || response.statusCode == 200) {
    print("✅ Producto creado exitosamente");
  } else {
    print("❌ Error al crear producto: ${response.statusCode}");
  }
}

Future<List<Producto>> obtenerProductos(
  int idUsuario, {
  int? categoriaId,
}) async {
  Uri url;

  if (categoriaId == null) {
    // Todas las categorías: endpoint para todos los productos del usuario
    url = Uri.parse('${GlobalStorage.url}productos/crear/usuario/$idUsuario/');
  } else {
    // Filtrado por categoría
    url = Uri.parse(
      '${GlobalStorage.url}productos/PorCategoria/usuario/$idUsuario/categoria/$categoriaId/',
    );
  }

  final response = await http.get(url);

  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((item) => Producto.fromJson(item)).toList();
  } else {
    throw Exception('Error cargando productos: ${response.statusCode}');
  }
}

//----------------------------- Variables globales--------------------------------------
TextEditingController categoriaController = TextEditingController();
List<Categoria> categorias = [];
Categoria? categoriaSeleccionada;

List<Categoria> categorias2 = [];
Categoria? categoriaSeleccionada2;
File? imagenSeleccionada;
final ImagePicker picker = ImagePicker();

Future<void> cargarCategorias() async {
  try {
    categorias2 = await fetchCategoriasUsuario();
  } catch (e) {
    print("Error cargando categorías: $e");
  }
}

Future<void> seleccionarImagen() async {
  final XFile? imagen = await picker.pickImage(source: ImageSource.gallery);
  if (imagen != null) {
    imagenSeleccionada = File(imagen.path);
  }
}

//----------------------------- Variables globales--------------------------------------
class InventarioScreen extends StatefulWidget {
  const InventarioScreen({super.key});

  @override
  State<InventarioScreen> createState() => _InventarioScreenState();
}

class _InventarioScreenState extends State<InventarioScreen> {
  late Future<List<Producto>> _productosFuture;

  @override
  @override
  void initState() {
    super.initState();
    categoriaSeleccionada = null; // por defecto todas
    _cargarProductos();
  }

  void _cargarProductos() {
    final int idUsuario = GlobalStorage.userId ?? 0;
    setState(() {
      _productosFuture = obtenerProductos(
        idUsuario,
        categoriaId: categoriaSeleccionada?.id,
      );
    });
  }

  void _abrirFormularioYRecargar() async {
    final resultado = await _mostrarFormularioCrearProducto(context);
    if (resultado == true) {
      _cargarProductos(); // Aquí sí recargas y refrescas la UI
    }
  }

  Future<bool?> _mostrarFormularioEditarProducto(
    BuildContext context,
    Producto producto,
  ) async {
    categorias2 = await fetchCategoriasUsuario();

    final TextEditingController nombreController = TextEditingController(
      text: producto.nombre,
    );
    final TextEditingController precioCompraController = TextEditingController(
      text: producto.precioCompra,
    );
    final TextEditingController precioVentaController = TextEditingController(
      text: producto.precioVenta,
    );
    final TextEditingController descripcionController = TextEditingController(
      text: producto.descripcion,
    );
    final TextEditingController stockController = TextEditingController(
      text: producto.stock.toString(),
    );
    final TextEditingController minController =
        TextEditingController(); // Puedes precargar si tienes los datos
    final TextEditingController maxController =
        TextEditingController(); // Puedes precargar si tienes los datos

    categoriaSeleccionada2 = categorias2.firstWhere(
      (cat) => cat.id == producto.categoria?.id,
      orElse: () => categorias2.first,
    );

    imagenSeleccionada = null;

    Future<void> seleccionarImagen() async {
      final XFile? pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
      );
      if (pickedFile != null) {
        imagenSeleccionada = File(pickedFile.path);
      }
    }

    return await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        bool isSubmitting = false;

        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: StatefulBuilder(
            builder:
                (context, setState) => SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        "Editar Producto",
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF45a049),
                        ),
                      ),
                      TextField(
                        controller: nombreController,
                        decoration: const InputDecoration(labelText: 'Nombre'),
                      ),
                      TextField(
                        controller: precioCompraController,
                        decoration: const InputDecoration(
                          labelText: 'Precio Compra',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: precioVentaController,
                        decoration: const InputDecoration(
                          labelText: 'Precio Venta',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: descripcionController,
                        decoration: const InputDecoration(
                          labelText: 'Descripción',
                        ),
                      ),
                      TextField(
                        controller: stockController,
                        decoration: const InputDecoration(
                          labelText: 'Stock Inicial',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: minController,
                        decoration: const InputDecoration(
                          labelText: 'Cantidad Mínima',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: maxController,
                        decoration: const InputDecoration(
                          labelText: 'Cantidad Máxima',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      DropdownButtonFormField<Categoria>(
                        value: categoriaSeleccionada2,
                        items:
                            categorias2.map((categoria) {
                              return DropdownMenuItem(
                                value: categoria,
                                child: Text(categoria.nombre),
                              );
                            }).toList(),
                        onChanged:
                            (value) =>
                                setState(() => categoriaSeleccionada2 = value),
                        decoration: const InputDecoration(
                          labelText: 'Categoría',
                        ),
                      ),
                      const SizedBox(height: 10),
                      producto.imagenUrl != null && imagenSeleccionada == null
                          ? Column(
                            children: [
                              Image.network(producto.imagenUrl!, height: 100),
                              TextButton(
                                onPressed: () async {
                                  await seleccionarImagen();
                                  setState(() {});
                                },
                                child: const Text("Cambiar imagen"),
                              ),
                            ],
                          )
                          : imagenSeleccionada != null
                          ? Column(
                            children: [
                              Image.file(imagenSeleccionada!, height: 100),
                              TextButton(
                                onPressed: () async {
                                  await seleccionarImagen();
                                  setState(() {});
                                },
                                child: const Text("Cambiar imagen"),
                              ),
                            ],
                          )
                          : TextButton.icon(
                            icon: const Icon(Icons.image),
                            label: const Text("Seleccionar Imagen"),
                            onPressed: () async {
                              await seleccionarImagen();
                              setState(() {});
                            },
                          ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextButton(
                              onPressed:
                                  isSubmitting
                                      ? null
                                      : () => Navigator.of(context).pop(false),
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text(
                                "Cancelar",
                                style: TextStyle(
                                  color: Color(0xFF45a049),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed:
                                  isSubmitting
                                      ? null
                                      : () async {
                                        if (categoriaSeleccionada2 == null) {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                                "La categoría es requerida.",
                                              ),
                                            ),
                                          );
                                          return;
                                        }

                                        setState(() => isSubmitting = true);

                                        await modificarProducto(
                                          productoId:
                                              producto.id, // debe ir con nombre
                                          nombre: nombreController.text,
                                          precioCompra:
                                              double.tryParse(
                                                precioCompraController.text,
                                              ) ??
                                              0,
                                          precioVenta:
                                              double.tryParse(
                                                precioVentaController.text,
                                              ) ??
                                              0,
                                          descripcion:
                                              descripcionController.text,
                                          stockInicial:
                                              int.tryParse(
                                                stockController.text,
                                              ) ??
                                              0, // nombre correcto
                                          cantidadMinima:
                                              int.tryParse(
                                                minController.text,
                                              ) ??
                                              0, // faltaba
                                          cantidadMaxima:
                                              int.tryParse(
                                                maxController.text,
                                              ) ??
                                              0, // faltaba
                                          categoriaId:
                                              categoriaSeleccionada2!.id,
                                          imagen: imagenSeleccionada,
                                        );

                                        Navigator.of(context).pop(true);

                                        await Future.delayed(
                                          const Duration(milliseconds: 100),
                                        );

                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Producto modificado correctamente',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                            duration: Duration(seconds: 3),
                                            backgroundColor: Color(0xFF45a049),
                                          ),
                                        );
                                      },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF45a049),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child:
                                  isSubmitting
                                      ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                      : const Text(
                                        "Actualizar",
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
          ),
        );
      },
    );
  }

  Future<bool?> _mostrarFormularioCrearProducto(BuildContext context) async {
    categorias2 = await fetchCategoriasUsuario();

    final TextEditingController nombreController = TextEditingController();
    final TextEditingController precioCompraController =
        TextEditingController();
    final TextEditingController precioVentaController = TextEditingController();
    final TextEditingController descripcionController = TextEditingController();
    final TextEditingController stockController = TextEditingController();
    final TextEditingController minController = TextEditingController();
    final TextEditingController maxController = TextEditingController();

    categoriaSeleccionada2 = categorias2.isNotEmpty ? categorias2.first : null;
    imagenSeleccionada = null;

    Future<void> seleccionarImagen() async {
      final XFile? pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
      );
      if (pickedFile != null) {
        imagenSeleccionada = File(pickedFile.path);
      }
    }

    return await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        bool isSubmitting = false;

        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: StatefulBuilder(
            builder:
                (context, setState) => SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        "Nuevo Producto",
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF45a049),
                        ),
                      ),
                      TextField(
                        controller: nombreController,
                        decoration: const InputDecoration(labelText: 'Nombre'),
                      ),
                      TextField(
                        controller: precioCompraController,
                        decoration: const InputDecoration(
                          labelText: 'Precio Compra',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: precioVentaController,
                        decoration: const InputDecoration(
                          labelText: 'Precio Venta',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: descripcionController,
                        decoration: const InputDecoration(
                          labelText: 'Descripción',
                        ),
                      ),
                      TextField(
                        controller: stockController,
                        decoration: const InputDecoration(
                          labelText: 'Stock Inicial',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: minController,
                        decoration: const InputDecoration(
                          labelText: 'Cantidad Mínima',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      TextField(
                        controller: maxController,
                        decoration: const InputDecoration(
                          labelText: 'Cantidad Máxima',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<Categoria>(
                        value: categoriaSeleccionada2,
                        items:
                            categorias2.map((categoria) {
                              return DropdownMenuItem(
                                value: categoria,
                                child: Text(categoria.nombre),
                              );
                            }).toList(),
                        onChanged:
                            (value) =>
                                setState(() => categoriaSeleccionada2 = value),
                        decoration: const InputDecoration(
                          labelText: 'Categoría',
                        ),
                      ),
                      const SizedBox(height: 10),
                      imagenSeleccionada != null
                          ? Column(
                            children: [
                              Image.file(imagenSeleccionada!, height: 100),
                              TextButton(
                                onPressed: () async {
                                  await seleccionarImagen();
                                  setState(() {});
                                },
                                child: const Text("Cambiar imagen"),
                              ),
                            ],
                          )
                          : TextButton.icon(
                            icon: const Icon(Icons.image),
                            label: const Text("Seleccionar Imagen"),
                            onPressed: () async {
                              await seleccionarImagen();
                              setState(() {});
                            },
                          ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextButton(
                              onPressed:
                                  isSubmitting
                                      ? null
                                      : () => Navigator.of(context).pop(false),
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text(
                                "Cancelar",
                                style: TextStyle(
                                  color: Color(0xFF45a049),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed:
                                  isSubmitting
                                      ? null
                                      : () async {
                                        if (categoriaSeleccionada2 == null ||
                                            imagenSeleccionada == null) {
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                                "Imagen y categoría son requeridas.",
                                              ),
                                            ),
                                          );
                                          return;
                                        }

                                        setState(() {
                                          isSubmitting = true;
                                        });

                                        final int idUsuario =
                                            GlobalStorage.userId ?? 0;
                                        await crearProductoConImagen(
                                          usuarioId: idUsuario,
                                          nombre: nombreController.text,
                                          precioCompra:
                                              double.tryParse(
                                                precioCompraController.text,
                                              ) ??
                                              0,
                                          precioVenta:
                                              double.tryParse(
                                                precioVentaController.text,
                                              ) ??
                                              0,
                                          descripcion:
                                              descripcionController.text,
                                          stockInicial:
                                              int.tryParse(
                                                stockController.text,
                                              ) ??
                                              0,
                                          cantidadMinima:
                                              int.tryParse(
                                                minController.text,
                                              ) ??
                                              0,
                                          cantidadMaxima:
                                              int.tryParse(
                                                maxController.text,
                                              ) ??
                                              0,
                                          categoriaId:
                                              categoriaSeleccionada2!.id,
                                          imagen: imagenSeleccionada!,
                                        );

                                        Navigator.of(context).pop(true);

                                        // Esperamos que se cierre el modal antes de mostrar el SnackBar
                                        await Future.delayed(
                                          const Duration(milliseconds: 100),
                                        );

                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Producto registrado correctamente',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                            duration: Duration(seconds: 3),
                                            backgroundColor: Color(0xFF45a049),
                                          ),
                                        );
                                      },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF45a049),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child:
                                  isSubmitting
                                      ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                      : const Text(
                                        "Registrar",
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Inventario',
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              children: [
                SizedBox(
                  width:
                      MediaQuery.of(context).size.width * 0.43 -
                      16, // mitad menos padding
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final rootContext =
                          context; // Guardamos el contexto principal
                      categorias = await fetchCategoriasUsuario();
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled:
                            true, // Permite altura personalizada
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                        ),
                        backgroundColor: Colors.white,
                        builder: (context) {
                          return Container(
                            constraints: BoxConstraints(
                              maxHeight:
                                  MediaQuery.of(context).size.height * 0.8,
                            ),
                            padding: const EdgeInsets.all(16),
                            child: SingleChildScrollView(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      // "Todas las categorías" por defecto
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 6,
                                        ),
                                        child: InkWell(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          onTap: () {
                                            setState(() {
                                              categoriaSeleccionada = null;
                                            });
                                            Navigator.pop(context);
                                            _cargarProductos();
                                          },
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color:
                                                  categoriaSeleccionada == null
                                                      ? const Color(
                                                        0xFFd0e8d0,
                                                      ) // resaltado
                                                      : const Color.fromARGB(
                                                        255,
                                                        225,
                                                        225,
                                                        241,
                                                      ),
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 14,
                                              horizontal: 12,
                                            ),
                                            child: const Text(
                                              'Todas las categorías',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(height: 0),

                                      // Categorías del usuario
                                      ...categorias.map((categoria) {
                                        final isSelected =
                                            categoriaSeleccionada?.id ==
                                            categoria.id;
                                        return Padding(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 6,
                                          ),
                                          child: InkWell(
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                            onTap: () {
                                              setState(() {
                                                categoriaSeleccionada =
                                                    categoria;
                                              });
                                              Navigator.pop(context);
                                              _cargarProductos();
                                            },
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color:
                                                    isSelected
                                                        ? const Color(
                                                          0xFFd0e8d0,
                                                        )
                                                        : const Color.fromARGB(
                                                          255,
                                                          225,
                                                          225,
                                                          241,
                                                        ),
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 14,
                                                    horizontal: 12,
                                                  ),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Text(
                                                    categoria.nombre,
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                  GestureDetector(
                                                    onTap: () {
                                                      showDialog(
                                                        context: context,
                                                        builder: (
                                                          dialogContext,
                                                        ) {
                                                          return AlertDialog(
                                                            shape: RoundedRectangleBorder(
                                                              borderRadius:
                                                                  BorderRadius.circular(
                                                                    15,
                                                                  ),
                                                            ),
                                                            backgroundColor:
                                                                const Color.fromARGB(
                                                                  255,
                                                                  225,
                                                                  225,
                                                                  241,
                                                                ),
                                                            title: const Center(
                                                              child: Text(
                                                                'Confirmar eliminación',
                                                                style: TextStyle(
                                                                  color: Color(
                                                                    0xFF45a049,
                                                                  ),
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold,
                                                                  fontSize: 23,
                                                                ),
                                                              ),
                                                            ),
                                                            content: Text(
                                                              '¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?',
                                                            ),
                                                            actionsPadding:
                                                                const EdgeInsets.symmetric(
                                                                  horizontal:
                                                                      20,
                                                                  vertical: 10,
                                                                ),
                                                            contentPadding:
                                                                const EdgeInsets.fromLTRB(
                                                                  24,
                                                                  20,
                                                                  24,
                                                                  0,
                                                                ),
                                                            actions: [
                                                              Row(
                                                                children: [
                                                                  Expanded(
                                                                    child: TextButton(
                                                                      onPressed:
                                                                          () => Navigator.pop(
                                                                            dialogContext,
                                                                          ),
                                                                      style: TextButton.styleFrom(
                                                                        backgroundColor:
                                                                            const Color(
                                                                              0xFF45a049,
                                                                            ),
                                                                        shape: RoundedRectangleBorder(
                                                                          borderRadius: BorderRadius.circular(
                                                                            10,
                                                                          ),
                                                                        ),
                                                                        padding: const EdgeInsets.symmetric(
                                                                          vertical:
                                                                              5,
                                                                        ),
                                                                      ),
                                                                      child: const Text(
                                                                        'Cancelar',
                                                                        style: TextStyle(
                                                                          fontSize:
                                                                              15,
                                                                          fontWeight:
                                                                              FontWeight.bold,
                                                                          color:
                                                                              Colors.white,
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                  const SizedBox(
                                                                    width: 10,
                                                                  ),
                                                                  Expanded(
                                                                    child: OutlinedButton(
                                                                      onPressed: () async {
                                                                        Navigator.pop(
                                                                          dialogContext,
                                                                        ); // cerrar el diálogo

                                                                        await eliminarCategoria(
                                                                          GlobalStorage
                                                                              .userId!,
                                                                          categoria
                                                                              .id,
                                                                        );

                                                                        if (context
                                                                            .mounted) {
                                                                          setState(() {
                                                                            categorias.removeWhere(
                                                                              (
                                                                                c,
                                                                              ) =>
                                                                                  c.id ==
                                                                                  categoria.id,
                                                                            );
                                                                          });
                                                                        }
                                                                        Navigator.pop(
                                                                          context,
                                                                        ); // ✅ Cierra el modal después de eliminar
                                                                        ScaffoldMessenger.of(
                                                                          context,
                                                                        ).showSnackBar(
                                                                          SnackBar(
                                                                            content: Text(
                                                                              'Categoría "${categoria.nombre}" eliminada',
                                                                              style: const TextStyle(
                                                                                fontSize:
                                                                                    15,
                                                                                fontWeight:
                                                                                    FontWeight.bold,
                                                                                color:
                                                                                    Colors.white,
                                                                              ),
                                                                            ),
                                                                            backgroundColor: const Color(
                                                                              0xFF45a049,
                                                                            ),
                                                                          ),
                                                                        );
                                                                      },
                                                                      style: OutlinedButton.styleFrom(
                                                                        backgroundColor:
                                                                            Colors.white,
                                                                        side:
                                                                            BorderSide.none,
                                                                        shape: RoundedRectangleBorder(
                                                                          borderRadius: BorderRadius.circular(
                                                                            10,
                                                                          ),
                                                                        ),
                                                                        padding: const EdgeInsets.symmetric(
                                                                          vertical:
                                                                              5,
                                                                        ),
                                                                      ),
                                                                      child: const Text(
                                                                        'Eliminar',
                                                                        style: TextStyle(
                                                                          fontSize:
                                                                              15,
                                                                          fontWeight:
                                                                              FontWeight.bold,
                                                                          color:
                                                                              Colors.red,
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ],
                                                              ),
                                                            ],
                                                          );
                                                        },
                                                      );
                                                    },
                                                    child: const Icon(
                                                      Icons.delete,
                                                      color: Colors.red,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ],
                                  ),

                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      categoriaController.clear();
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        shape: const RoundedRectangleBorder(
                                          borderRadius: BorderRadius.vertical(
                                            top: Radius.circular(16),
                                          ),
                                        ),
                                        backgroundColor: Colors.white,
                                        builder: (context) {
                                          return Padding(
                                            padding: MediaQuery.of(context)
                                                .viewInsets
                                                .add(const EdgeInsets.all(16)),
                                            child: Column(
                                              mainAxisSize: MainAxisSize.min,
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.stretch,
                                              children: [
                                                const SizedBox(height: 10),
                                                TextField(
                                                  controller:
                                                      categoriaController,
                                                  decoration: const InputDecoration(
                                                    labelText:
                                                        'Nombre de la categoría',
                                                    border:
                                                        OutlineInputBorder(),
                                                  ),
                                                ),
                                                const SizedBox(height: 16),
                                                ElevatedButton.icon(
                                                  onPressed: () async {
                                                    final nombre =
                                                        categoriaController.text
                                                            .trim();
                                                    if (nombre.isNotEmpty) {
                                                      try {
                                                        await insertarCategoria(
                                                          nombre,
                                                        );
                                                        Navigator.pop(
                                                          context,
                                                        ); // cerrar modal interno
                                                        Navigator.pop(
                                                          rootContext,
                                                        ); // cerrar modal externo
                                                        ScaffoldMessenger.of(
                                                          rootContext,
                                                        ).showSnackBar(
                                                          const SnackBar(
                                                            content: Text(
                                                              'Catálogo registrado correctamente',
                                                              style: TextStyle(
                                                                fontSize: 14,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                                color:
                                                                    Colors
                                                                        .white,
                                                              ),
                                                            ),
                                                            duration: Duration(
                                                              seconds: 3,
                                                            ),
                                                            backgroundColor:
                                                                Color(
                                                                  0xFF45a049,
                                                                ),
                                                          ),
                                                        );
                                                      } catch (e) {
                                                        print(e);
                                                      }
                                                    }
                                                  },
                                                  label: const Text(
                                                    'Registrar Categoría',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor:
                                                        const Color(0xFF45a049),
                                                    foregroundColor:
                                                        Colors.white,
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          vertical: 14,
                                                        ),
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            10,
                                                          ),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 50),
                                              ],
                                            ),
                                          );
                                        },
                                      );
                                    },
                                    icon: const Icon(
                                      Icons.add,
                                      color: Colors.white,
                                    ),
                                    label: const Text(
                                      'Agregar Categoría',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      minimumSize: const Size(
                                        double.infinity,
                                        48,
                                      ),
                                      backgroundColor: const Color(0xFF45a049),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 50),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                    icon: const Icon(Icons.local_offer, color: Colors.white),
                    label: const Text(
                      'Categorías',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF45a049),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      textStyle: const TextStyle(fontSize: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Texto que muestra la categoría seleccionada, ocupa la otra mitad
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 11,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle,
                          color: Color(0xFF45a049),
                          size: 20,
                        ),
                        const SizedBox(width: 8), // Espacio entre ícono y texto
                        Expanded(
                          child: Text(
                            '${categoriaSeleccionada?.nombre ?? 'Todas las categorías'}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF45a049),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: FutureBuilder<List<Producto>>(
              future: _productosFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(
                    child: Text(
                      'No hay productos disponibles.',
                      style: TextStyle(fontSize: 16, color: Colors.black54),
                    ),
                  );
                }

                final productos = snapshot.data!;

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  itemCount: productos.length,
                  itemBuilder: (context, index) {
                    final producto = productos[index];

                    return Card(
                      color: Colors.white,
                      elevation: 3,
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(30, 10, 20, 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Imagen del producto
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child:
                                  producto.imagenUrl != null
                                      ? Image.network(
                                        producto.imagenUrl!,
                                        width: 100,
                                        height: 100,
                                        fit: BoxFit.cover,
                                      )
                                      : const Icon(Icons.image, size: 100),
                            ),
                            const SizedBox(width: 30),

                            // Detalles del producto + iconos
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    producto.nombre,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: Color(0xFF45a049),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),

                                  Text(
                                    'Categoría: ${producto.categoria?.nombre ?? "Sin categoría"}',
                                    style: const TextStyle(fontSize: 11),
                                  ),

                                  Text(
                                    'Compra: ${producto.precioCompra} BOB',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  Text(
                                    'Venta: ${producto.precioVenta} BOB',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  Text(
                                    'Stock: ${producto.stock}',
                                    style: const TextStyle(fontSize: 11),
                                  ),

                                  const SizedBox(height: 6),

                                  Row(
                                    children: [
                                      // Botón Editar
                                      Expanded(
                                        child: GestureDetector(
                                          onTap: () async {
                                            final resultado =
                                                await _mostrarFormularioEditarProducto(
                                                  context,
                                                  producto,
                                                );
                                            if (resultado == true) {
                                              _cargarProductos();
                                            }
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.green[600],
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Text(
                                              'Editar',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(width: 16),

                                      // Botón Eliminar
                                      Expanded(
                                        child: GestureDetector(
                                          onTap: () async {
                                            final int idUsuario =
                                                GlobalStorage.userId ?? 0;
                                            await obtenerDetalleProducto(
                                              usuarioId: idUsuario,
                                              productoId: producto.id,
                                            );
                                            _cargarProductos();
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              border: Border.all(
                                                color: Colors.red,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Text(
                                              'Eliminar',
                                              style: TextStyle(
                                                color: Colors.red,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF45a049),
        onPressed: () => _abrirFormularioYRecargar(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
