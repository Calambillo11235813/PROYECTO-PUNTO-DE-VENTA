import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:punto_venta/global/global_storage.dart';
import 'package:intl/intl.dart';

class CajaScreen extends StatefulWidget {
  const CajaScreen({super.key});

  @override
  State<CajaScreen> createState() => _CajaScreenState();
}

class _CajaScreenState extends State<CajaScreen> {
  Map<String, dynamic>? cajaActual;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    cargarCajaActual();
  }

  String _formatFecha(String? isoDate) {
    if (isoDate == null) return '';
    final fecha = DateTime.tryParse(isoDate);
    return fecha != null
        ? DateFormat('dd/MM/yyyy – HH:mm:ss').format(fecha.toLocal())
        : '';
  }

  Future<void> cargarMovimientos() async {
    if (cajaActual == null) return;

    setState(() {
      loadingMovimientos = true;
    });

    final idCaja = cajaActual!['id'];
    final url = GlobalStorage.url + 'ventas/caja/$idCaja/movimientos/';

    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _movimientos = data;
          loadingMovimientos = false;
        });
      } else {
        setState(() {
          _movimientos = [];
          loadingMovimientos = false;
        });
      }
    } catch (e) {
      setState(() {
        _movimientos = [];
        loadingMovimientos = false;
      });
    }
  }

  Future<void> cerrarCaja() async {
    final userId = GlobalStorage.userId;
    final url = Uri.parse('${GlobalStorage.url}ventas/caja/cerrar/$userId/');

    try {
      final response = await http.patch(
        url,
        body: jsonEncode({}),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          cajaActual = data; // Actualizas el estado con la caja cerrada
          // Aquí puedes actualizar otras variables si quieres
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Caja cerrada correctamente'),
            backgroundColor: Color(0xFF45a049),
          ),
        );
      } else {
        throw Exception('Error al cerrar la caja');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  List<dynamic> empleados = [];

  Future<void> fetchEmpleados() async {
    final userId = GlobalStorage.userId;
    final empleadosResponse = await http.get(
      Uri.parse('${GlobalStorage.url}accounts/empleados/$userId/'),
    );
    final rolesResponse = await http.get(
      Uri.parse('${GlobalStorage.url}accounts/roles/'),
    );

    if (empleadosResponse.statusCode == 200 &&
        rolesResponse.statusCode == 200) {
      final empleadosData = json.decode(empleadosResponse.body);
      final rolesData = json.decode(rolesResponse.body);

      Map<int, String> roles = {
        for (var r in rolesData) r['id'] as int: r['nombre_rol'] as String,
      };

      // Reemplaza el id del rol por el nombre en empleados
      for (var emp in empleadosData) {
        final rolId = emp['rol'];
        emp['rol'] = roles[rolId] ?? 'Desconocido';
      }

      // Filtra solo los empleados con rol "Cajero"
      final cajeros =
          empleadosData.where((emp) => emp['rol'] == 'Cajero').toList();

      setState(() {
        empleados = cajeros;
      });
    }
  }

  Future<List<dynamic>> obtenerEmpleados() async {
    final userId = GlobalStorage.userId;

    final response = await http.get(
      Uri.parse('${GlobalStorage.url}accounts/empleados/$userId/'),
    );

    if (response.statusCode == 200) {
      final empleadosData = json.decode(response.body);
      return empleadosData;
    } else {
      throw Exception('Error al obtener empleados');
    }
  }

  // Función para cargar datos y mostrar modal
  Future<void> cargarDatosYMostrarModal() async {
    await fetchEmpleados();
    mostrarModalAbrirCaja(empleados);
  }

  int _totalMovimientos = 0;
  double _balanceActual = 0;
  String _nombreCajero = '';
  Future<void> cargarCajaActual() async {
    final idUsuario = GlobalStorage.userId ?? 0;
    final url = Uri.parse('${GlobalStorage.url}ventas/caja/actual/$idUsuario/');

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        List movimientos = data['movimientos_efectivo'] ?? [];
        int totalMovimientos = movimientos.length;

        double montoInicial =
            double.tryParse(data['monto_inicial'] ?? '0') ?? 0;

        double sumaIngresos = 0;
        double sumaRetiros = 0;
        for (var mov in movimientos) {
          double montoMov = double.tryParse(mov['monto'] ?? '0') ?? 0;
          if (mov['tipo'] == 'ingreso') {
            sumaIngresos += montoMov;
          } else if (mov['tipo'] == 'retiro') {
            sumaRetiros += montoMov;
          }
        }

        double balanceActual = montoInicial + sumaIngresos - sumaRetiros;

        // Obtener nombre del empleado
        final empleados = await obtenerEmpleados();
        final empleadoId = data['empleado'];
        final empleado = empleados.firstWhere(
          (e) => e['id'] == empleadoId,
          orElse: () => null,
        );

        final nombreEmpleado =
            empleado != null ? empleado['nombre'] : 'Desconocido';

        setState(() {
          cajaActual = data;
          GlobalStorage.cajaId = data['id'];
          loading = false;
          _totalMovimientos = totalMovimientos;
          _balanceActual = balanceActual;
          _nombreCajero = nombreEmpleado; // Aquí guardamos el nombre
        });

        await cargarMovimientos();
      } else {
        _resetCaja();
      }
    } catch (e) {
      _resetCaja();
    }
  }

  void _resetCaja() {
    setState(() {
      loading = false;
      cajaActual = null;
      GlobalStorage.cajaId = null;
      _movimientos = [];
      _totalMovimientos = 0;
      _balanceActual = 0;
      _nombreCajero = '';
    });
  }

  Future<void> abrirCaja(double montoInicial, int empleadoId) async {
    final idUsuario = GlobalStorage.userId ?? 0;
    final url = Uri.parse('${GlobalStorage.url}ventas/caja/abrir/$idUsuario/');
    final body = json.encode({
      "monto_inicial": montoInicial,
      "empleado": empleadoId,
    });

    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: body,
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        GlobalStorage.cajaId = data['id']; // guardar ID de la caja

        Navigator.pop(context);
        cargarCajaActual();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Caja abierta correctamente')),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Error al abrir caja')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error de red al abrir caja')),
      );
    }
  }

  void mostrarModalAbrirCaja(List<dynamic> empleados) {
    final TextEditingController montoController = TextEditingController();
    int? empleadoSeleccionado; // ID del empleado seleccionado

    // Variables para controlar el error
    bool montoError = false;
    bool empleadoError = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: MediaQuery.of(context).viewInsets,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: StatefulBuilder(
              builder: (BuildContext context, StateSetter setStateModal) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Abrir Caja',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: montoController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Monto inicial',
                        border: OutlineInputBorder(),
                        errorText: montoError ? 'Campo requerido' : null,
                      ),
                      onChanged: (_) {
                        if (montoError) {
                          setStateModal(() {
                            montoError = false;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                    DropdownButtonFormField<int>(
                      decoration: InputDecoration(
                        labelText: 'Seleccionar Cajero',
                        border: OutlineInputBorder(),
                        errorText:
                            empleadoError ? 'Seleccione un cajero' : null,
                      ),
                      value: empleadoSeleccionado,
                      items:
                          empleados.map<DropdownMenuItem<int>>((emp) {
                            return DropdownMenuItem<int>(
                              value: emp['id'] as int,
                              child: Text(emp['nombre'] ?? 'Sin nombre'),
                            );
                          }).toList(),
                      onChanged: (value) {
                        setStateModal(() {
                          empleadoSeleccionado = value;
                          empleadoError = false;
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text(
                              'Cancelar',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF45a049),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              final monto = double.tryParse(
                                montoController.text,
                              );
                              setStateModal(() {
                                montoError = monto == null;
                                empleadoError = empleadoSeleccionado == null;
                              });

                              if (monto != null &&
                                  empleadoSeleccionado != null) {
                                abrirCaja(monto, empleadoSeleccionado!);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF45a049),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text(
                              'Confirmar',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 50),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _infoCard(String title, String value, Color bgColor, IconData icon) {
    const Color colorVerde = Color(0xFF45a049);

    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(5),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color.fromARGB(137, 46, 45, 45),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Icon(
                  icon,
                  color: colorVerde,
                  size: 22, // Tamaño actualizado aquí
                ),
              ],
            ),
            const SizedBox(height: 5),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<dynamic>? _movimientos;
  bool loadingMovimientos = false;
  Widget _infoCardSimple(String titulo, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 2,
      ), // poco espacio entre filas
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            titulo,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          Text(
            valor,
            style: const TextStyle(fontSize: 16, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Administrar Caja',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF45a049),
      ),
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      body:
          loading
              ? const Center(child: CircularProgressIndicator())
              : cajaActual != null && cajaActual!['estado'] == 'abierta'
              ? SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Caja - Abierta',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(
                          width: 8,
                        ), // espacio pequeño entre textos
                        const Icon(Icons.circle, color: Colors.green, size: 12),
                        const SizedBox(width: 5),
                        const Text(
                          'Activa',
                          style: TextStyle(color: Colors.green),
                        ),
                      ],
                    ),

                    const SizedBox(height: 5),

                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.access_time,
                              color: Colors.green,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Abierta el ${_formatFecha(cajaActual?['fecha_apertura'])}',
                              style: const TextStyle(color: Colors.black54),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(
                              Icons.person,
                              color: Colors.green,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Cajero: $_nombreCajero',
                              style: const TextStyle(color: Colors.black54),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pushNamed(context, '/ventas');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,

                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text(
                              'Ir a Punto de Venta',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF45a049),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (context) {
                                  // Función local solo para este diálogo:
                                  Widget _infoRow(
                                    IconData icon,
                                    String title,
                                    String value,
                                  ) {
                                    return Row(
                                      children: [
                                        Icon(
                                          icon,
                                          color: const Color(0xFF45a049),
                                          size: 30,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: RichText(
                                            text: TextSpan(
                                              style: const TextStyle(
                                                color: Colors.black,
                                                fontSize: 16,
                                              ),
                                              children: [
                                                TextSpan(
                                                  text: '$title: ',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                TextSpan(text: value),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  }

                                  return AlertDialog(
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    backgroundColor: const Color.fromARGB(
                                      255,
                                      225,
                                      225,
                                      241,
                                    ),
                                    title: const Center(
                                      child: Text(
                                        '¿Realmente quieres cerrar esta caja?',
                                        style: TextStyle(
                                          color: Color(0xFF45a049),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 24,
                                        ),
                                      ),
                                    ),
                                    content: SingleChildScrollView(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          _infoCardSimple(
                                            'Monto Inicial',
                                            '${cajaActual!['monto_inicial']} BOB',
                                          ),
                                          _infoCardSimple(
                                            'Movimientos',
                                            '$_totalMovimientos registros',
                                          ),
                                          _infoCardSimple(
                                            'Total Ventas',
                                            '0.00 BOB',
                                          ),
                                          _infoCardSimple(
                                            'Balance Actual',
                                            '${_balanceActual.toStringAsFixed(2)} BOB',
                                          ),
                                        ],
                                      ),
                                    ),
                                    actionsPadding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                      vertical: 10,
                                    ),
                                    contentPadding: const EdgeInsets.fromLTRB(
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
                                                  () => Navigator.pop(context),
                                              style: TextButton.styleFrom(
                                                backgroundColor: const Color(
                                                  0xFF45a049,
                                                ),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 10,
                                                    ),
                                              ),
                                              child: const Text(
                                                'Cancelar',
                                                style: TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () async {
                                                Navigator.pop(context);
                                                await cerrarCaja();
                                              },
                                              style: OutlinedButton.styleFrom(
                                                backgroundColor: Colors.white,
                                                side: BorderSide.none,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 10,
                                                    ),
                                              ),
                                              child: const Text(
                                                'Confirmar',
                                                style: TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.red,
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
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text(
                              'Cerrar Caja',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10), // espacio debajo del botón
                    // CARDS
                    Row(
                      children: [
                        _infoCard(
                          'Monto Inicial',
                          '${cajaActual!['monto_inicial']} BOB',
                          Colors.white,
                          Icons.attach_money,
                        ),
                        _infoCard(
                          'Movimientos',
                          '$_totalMovimientos registros',
                          Colors.white,
                          Icons.swap_vert,
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        _infoCard(
                          'Total Ventas',
                          '0.00 BOB',
                          Colors.white,
                          Icons.shopping_cart, // Carrito
                        ),
                        _infoCard(
                          'Balance Actual',
                          '${_balanceActual.toStringAsFixed(2)} BOB',
                          Colors.white,
                          Icons.balance, // Balanza
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),
                    // NUEVO BOTÓN CENTRADO
                    Center(
                      child: ElevatedButton.icon(
                        onPressed: mostrarModalNuevoMovimiento,
                        icon: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 20,
                        ),
                        label: const Text(
                          'Nuevo Movimieno',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Movimientos de Efectivo',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    // Aquí agregas la lista o el indicador de carga
                    _movimientos == null
                        ? const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: CircularProgressIndicator()),
                        )
                        : _buildMovimientosList(_movimientos ?? []),
                  ],
                ),
              )
              : Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Card(
                    color: Colors.white,
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 30,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.account_balance_wallet,
                            size: 65,
                            color: Color(0xFF45a049),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'No hay una caja abierta actualmente',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Para comenzar a registrar ventas, debe abrir una caja ingresando el monto inicial.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 25),
                          ElevatedButton.icon(
                            onPressed: cargarDatosYMostrarModal,
                            icon: const Icon(
                              Icons.login,
                              size: 20,
                              color: Colors.white,
                            ),
                            label: const Text(
                              'Abrir Nueva Caja',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF45a049),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 30,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
    );
  }

  void mostrarModalNuevoMovimiento() {
    String tipoMovimiento = 'ingreso';
    final TextEditingController montoController = TextEditingController();
    final TextEditingController descripcionController = TextEditingController();

    bool montoValido = true;
    bool descripcionValida = true;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color.fromARGB(255, 225, 225, 241),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder:
              (context, setState) => Padding(
                padding: MediaQuery.of(context).viewInsets,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Nuevo Movimiento',
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF45a049),
                        ),
                      ),
                      const SizedBox(height: 20),
                      DropdownButtonFormField<String>(
                        value: tipoMovimiento,
                        items: const [
                          DropdownMenuItem(
                            value: 'ingreso',
                            child: Text('Ingreso'),
                          ),
                          DropdownMenuItem(
                            value: 'retiro',
                            child: Text('Retiro'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            tipoMovimiento = value;
                          }
                        },
                        decoration: const InputDecoration(
                          labelText: 'Tipo de Movimiento',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 15),
                      TextField(
                        controller: montoController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Monto',
                          border: const OutlineInputBorder(),
                          errorText: montoValido ? null : '',
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: montoValido ? Colors.green : Colors.red,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 15),
                      TextField(
                        controller: descripcionController,
                        decoration: InputDecoration(
                          labelText: 'Descripción',
                          border: const OutlineInputBorder(),
                          errorText: descripcionValida ? null : '',
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color:
                                  descripcionValida ? Colors.green : Colors.red,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 25),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                Navigator.pop(context);
                              },
                              style: OutlinedButton.styleFrom(
                                backgroundColor: Colors.white,
                                side: BorderSide.none,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text(
                                'Cancelar',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF45a049),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                final monto = double.tryParse(
                                  montoController.text,
                                );
                                final descripcion = descripcionController.text;
                                final idCaja = GlobalStorage.cajaId;

                                setState(() {
                                  montoValido = monto != null;
                                  descripcionValida = descripcion.isNotEmpty;
                                });

                                if (montoValido &&
                                    descripcionValida &&
                                    idCaja != null) {
                                  final url = Uri.parse(
                                    '${GlobalStorage.url}ventas/caja/$idCaja/movimientos/',
                                  );
                                  final body = json.encode({
                                    "tipo": tipoMovimiento,
                                    "monto": monto,
                                    "descripcion": descripcion,
                                  });

                                  final response = await http.post(
                                    url,
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: body,
                                  );

                                  if (response.statusCode == 201 ||
                                      response.statusCode == 200) {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        backgroundColor: const Color(
                                          0xFF45a049,
                                        ), // Fondo verde
                                        content: const Text(
                                          'Movimiento registrado',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                          ), // Texto blanco
                                        ),
                                      ),
                                    );

                                    cargarCajaActual();
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Error al registrar movimiento',
                                        ),
                                      ),
                                    );
                                  }
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF45a049),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text(
                                'Registrar',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 50),
                    ],
                  ),
                ),
              ),
        );
      },
    );
  }

  Widget _buildMovimientosList(List<dynamic> movimientos) {
    if (movimientos.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Text('No hay movimientos registrados.'),
      );
    }

    return Column(
      children:
          movimientos.map((mov) {
            final tipo = mov['tipo'];
            final monto = mov['monto'];
            final fechaRaw = mov['fecha'];
            final descripcion = mov['descripcion'];

            DateTime fecha = DateTime.tryParse(fechaRaw) ?? DateTime.now();
            String fechaStr =
                "${fecha.day.toString().padLeft(2, '0')}/"
                "${fecha.month.toString().padLeft(2, '0')}/"
                "${fecha.year} ${fecha.hour.toString().padLeft(2, '0')}:"
                "${fecha.minute.toString().padLeft(2, '0')}";

            return Card(
              color: Colors.white, // <-- Aquí el color blanco
              margin: const EdgeInsets.symmetric(vertical: 6),
              child: ListTile(
                leading: Icon(
                  tipo == 'ingreso' ? Icons.download : Icons.upload,
                  color: tipo == 'ingreso' ? Colors.green : Colors.red,
                ),
                title: Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(
                        text: "Tipo: ",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      TextSpan(text: tipo),
                    ],
                  ),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text.rich(
                      TextSpan(
                        children: [
                          const TextSpan(
                            text: "Monto: ",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          TextSpan(
                            text: "$monto BOB",
                            style: const TextStyle(color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                    Text.rich(
                      TextSpan(
                        children: [
                          const TextSpan(
                            text: "Descripción: ",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          TextSpan(
                            text: descripcion ?? '',
                            style: const TextStyle(color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                    Text.rich(
                      TextSpan(
                        children: [
                          const TextSpan(
                            text: "Fecha: ",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          TextSpan(
                            text: fechaStr,
                            style: const TextStyle(color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                isThreeLine: true,
              ),
            );
          }).toList(),
    );
  }
}
