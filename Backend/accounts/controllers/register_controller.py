import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Usuario, Empresa, Rol
from accounts.serializers import EmpresaSerializer
from rest_framework.permissions import AllowAny
from django.db import transaction


class RegisterView(APIView):
    permission_classes = [AllowAny]  # Permitir acceso sin autenticación
    
    @transaction.atomic  # Usar transacción para garantizar consistencia
    def post(self, request):
        # Extraer datos del request
        nombre = request.data.get('nombre')
        correo = request.data.get('correo')
        contraseña = request.data.get('contraseña')
        nombre_empresa = request.data.get('empresa')
        
        # Validar datos mínimos necesarios
        if not all([nombre, correo, contraseña, nombre_empresa]):
            return Response({
                "error": "Faltan campos requeridos: nombre, correo, contraseña y empresa"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar si el correo ya existe
            if Usuario.objects.filter(correo=correo).exists():
                return Response({
                    "error": "Este correo electrónico ya está registrado"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Crear empresa
            empresa = Empresa.objects.create(
                nombre=nombre_empresa,
                nit=f"TEMP-{uuid.uuid4().hex[:8].upper()}",  # Valor por defecto o vacío
                estado=True
            )
            
            # 2. Obtener rol administrador (asumiendo que ya existe con id=1)
            try:
                rol_admin = Rol.objects.get(id=1)  # O filtrar por nombre_rol="Administrador"
            except Rol.DoesNotExist:
                # Si no existe, crearlo
                rol_admin = Rol.objects.create(nombre_rol="Administrador")
            
            # 3. Crear usuario
            usuario = Usuario.objects.create(
                nombre=nombre,
                correo=correo,
                empresa=empresa,
                rol=rol_admin,
                is_staff=True,  # Es administrador
                estado=True
            )
            usuario.set_password(contraseña)  # Hashear la contraseña
            usuario.save()
            
            # 4. Preparar respuesta
            empresa_data = EmpresaSerializer(empresa).data
            
            return Response({
                "mensaje": "Registro exitoso. Por favor inicie sesión.",
                "empresa": empresa_data,
                "usuario": {
                    "id": usuario.id,
                    "nombre": usuario.nombre,
                    "correo": usuario.correo
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # En caso de error, deshacer transacción y retornar error
            return Response({
                "error": f"Error al procesar el registro: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)