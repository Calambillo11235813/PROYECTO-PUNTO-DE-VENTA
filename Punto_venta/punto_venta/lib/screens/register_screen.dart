import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/usuario.dart';
import '../services/usuario_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  final TextEditingController _direccionController = TextEditingController();
  final TextEditingController _fechaExpiracionController =
      TextEditingController();
  final TextEditingController _planController = TextEditingController();
  final TextEditingController _nombreEmpresaController =
      TextEditingController();
  final TextEditingController _nitEmpresaController = TextEditingController();

  final FocusNode _nameFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _confirmPasswordFocusNode = FocusNode();
  final FocusNode _direccionFocusNode = FocusNode();
  final FocusNode _fechaExpiracionFocusNode = FocusNode();
  final FocusNode _planFocusNode = FocusNode();
  final FocusNode _nombreEmpresaFocusNode = FocusNode();
  final FocusNode _nitEmpresaFocusNode = FocusNode();

  DateTime? _fechaExpiracionSeleccionada;
  bool isLoading = false;

  Future<void> _seleccionarFecha(BuildContext context) async {
    FocusScope.of(context).unfocus();

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _fechaExpiracionSeleccionada ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _fechaExpiracionSeleccionada = picked;
        _fechaExpiracionController.text = DateFormat(
          'yyyy-MM-dd',
        ).format(picked);
      });
    }
  }

  void _register() async {
    if (_formKey.currentState!.validate()) {
      if (_fechaExpiracionSeleccionada == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Por favor selecciona una fecha de expiración',
              style: TextStyle(color: Colors.white),
            ),
            backgroundColor: Color(0xFF45a049),
          ),
        );
        return;
      }

      setState(() {
        isLoading = true;
      });

      final usuario = Usuario(
        correo: _emailController.text.trim(),
        nombre: _nameController.text.trim(),
        password: _passwordController.text.trim(),
        direccion: _direccionController.text.trim(),
        estado: true,
        fechaExpiracion: _fechaExpiracionSeleccionada!,
        plan: _planController.text.trim(),
        nombreEmpresa: _nombreEmpresaController.text.trim(),
        nitEmpresa: _nitEmpresaController.text.trim(),
      );

      String? error = await UsuarioService.crearUsuario(usuario);

      if (!mounted) return;

      setState(() {
        isLoading = false;
      });

      if (error == null) {
        Navigator.pushReplacementNamed(context, '/login');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              error,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: Color(0xFF45a049),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _confirmPasswordFocusNode.dispose();
    _direccionFocusNode.dispose();
    _fechaExpiracionFocusNode.dispose();
    _planFocusNode.dispose();
    _nombreEmpresaFocusNode.dispose();
    _nitEmpresaFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(
        255,
        225,
        225,
        241,
      ), // ✅ Fondo personalizado
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              const SizedBox(height: 20),
              const Text(
                'Crear Cuenta',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF45a049),
                ),
              ),
              const SizedBox(height: 10),

              _buildTextField(
                _nameController,
                'Nombre Completo',
                _nameFocusNode,
                (value) =>
                    value == null || value.isEmpty ? 'Ingresa tu nombre' : null,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _emailController,
                'Correo Electrónico',
                _emailFocusNode,
                (value) {
                  if (value == null || value.isEmpty)
                    return 'Ingresa tu correo';
                  if (!RegExp(r'\S+@\S+\.\S+').hasMatch(value))
                    return 'Correo inválido';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _direccionController,
                'Dirección',
                _direccionFocusNode,
                (value) =>
                    value == null || value.isEmpty
                        ? 'Ingresa tu dirección'
                        : null,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _fechaExpiracionController,
                'Fecha de Expiración',
                _fechaExpiracionFocusNode,
                (value) =>
                    value == null || value.isEmpty
                        ? 'Selecciona la fecha de expiración'
                        : null,
                readOnly: true,
                onTap: () => _seleccionarFecha(context),
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _planController,
                'Plan',
                _planFocusNode,
                (value) =>
                    value == null || value.isEmpty ? 'Ingresa el plan' : null,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _nombreEmpresaController,
                'Nombre de la Empresa',
                _nombreEmpresaFocusNode,
                (value) =>
                    value == null || value.isEmpty
                        ? 'Ingresa el nombre de la empresa'
                        : null,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _nitEmpresaController,
                'NIT de la Empresa',
                _nitEmpresaFocusNode,
                (value) =>
                    value == null || value.isEmpty ? 'Ingresa el NIT' : null,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _passwordController,
                'Contraseña',
                _passwordFocusNode,
                (value) =>
                    value == null || value.isEmpty
                        ? 'Ingresa una contraseña'
                        : null,
                obscureText: true,
              ),
              const SizedBox(height: 16),

              _buildTextField(
                _confirmPasswordController,
                'Confirmar Contraseña',
                _confirmPasswordFocusNode,
                (value) =>
                    value != _passwordController.text
                        ? 'Las contraseñas no coinciden'
                        : null,
                obscureText: true,
              ),
              const SizedBox(height: 25),

              isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                    onPressed: _register,
                    child: const Text(
                      'Registrarse',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15, // Tamaño de fuente
                        fontWeight: FontWeight.bold, // Peso (negrita, etc.)
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      foregroundColor: const Color.fromARGB(255, 255, 255, 255),
                      minimumSize: const Size(double.infinity, 50),
                      backgroundColor: const Color(0xFF45a049), // Fondo verde
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          10,
                        ), // 🔷 Bordes redondeados
                      ),
                    ),
                  ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'Cancelar',
                  style: TextStyle(
                    color: Color(0xFF45a049),
                    fontSize: 15, // Tamaño de fuente
                    fontWeight: FontWeight.bold, // Peso (negrita, etc.)
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  foregroundColor: const Color(0xFF55B84B),
                  minimumSize: const Size(double.infinity, 50),
                  backgroundColor: Colors.white, // Fondo blanco
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      10,
                    ), // 🔷 Bordes redondeados
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                alignment: WrapAlignment.center,
                children: [
                  const Text(
                    '¿Ya tienes una cuenta? ',
                    style: TextStyle(color: Colors.black87, fontSize: 16),
                  ),
                  InkWell(
                    borderRadius: BorderRadius.circular(4),
                    splashColor: const Color(
                      0x3345a049,
                    ), // Efecto leve de fondo verde
                    highlightColor: const Color(0x1A45a049),
                    onTap: () {
                      Navigator.pushReplacementNamed(context, '/login');
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Text(
                        'Inicia sesión',
                        style: TextStyle(
                          color: Color(0xFF45a049),
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
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label,
    FocusNode focusNode,
    String? Function(String?)? validator, {
    bool obscureText = false,
    bool readOnly = false,
    void Function()? onTap,
  }) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      decoration: InputDecoration(
        labelText: label,
        filled: true, // ✅ Fondo blanco activado
        fillColor: Colors.white, // ✅ Caja blanca
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(
          vertical: 16.0,
          horizontal: 12.0,
        ),
      ),
      obscureText: obscureText,
      readOnly: readOnly,
      onTap: onTap,
      validator: validator,
    );
  }
}
