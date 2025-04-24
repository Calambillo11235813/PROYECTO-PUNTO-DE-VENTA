// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/authentication_service.dart';

/// Pantalla de login que recibe las credenciales del usuario y dirige a la pantalla principal al iniciar sesión.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Controladores para capturar la entrada del usuario
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  // Llave global utilizada para validar el formulario
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  // Indicador de carga para mostrar mientras se procesan las credenciales
  bool isLoading = false;

  /// Método que valida el formulario y realiza el login mediante el servicio de autenticación.
  /// En caso de éxito, se navega a la pantalla principal ('/home').
  void _login() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        isLoading = true;
      });

      // Espera asíncrona – puede haber "async gap"
      bool success = await AuthenticationService.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      // Verifica que el widget aún esté montado
      if (!mounted) return;

      setState(() {
        isLoading = false;
      });

      if (success) {
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error en inicio de sesión')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey, // Llave del formulario para validaciones
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Campo para correo electrónico
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Correo Electrónico'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingresa tu correo';
                  }
                  if (!RegExp(r'\S+@\S+\.\S+').hasMatch(value)) {
                    return 'Por favor, ingresa un correo válido';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              // Campo para contraseña
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Contraseña'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingresa tu contraseña';
                  }
                  if (value.length < 6) {
                    return 'La contraseña debe tener al menos 6 caracteres';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              // Botón o indicador de carga
              isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(
                    onPressed: _login,
                    child: Text('Iniciar Sesión'),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
