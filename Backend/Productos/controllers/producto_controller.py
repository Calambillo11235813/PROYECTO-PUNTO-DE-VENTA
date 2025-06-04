from accounts.utils.logger_utils import get_logger_por_usuario
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from Productos.models import Producto, Categoria
from Productos.serializers import ProductoSerializer
from accounts.models import Usuario
from accounts.serializers import UsuarioSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from accounts.decorators.plan_limits_decorators import check_product_limit, register_resource_usage


class ProductoListaCrearVista(APIView):
    """
    Vista para listar todos los productos de una empresa o crear uno nuevo.
    """

    def get(self, request, usuario_id):
        """
        Obtener la lista de productos de una empresa específica (GET)
        """
        productos = Producto.objects.filter(usuario_id=usuario_id)
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data)
    
    
    @check_product_limit  # Verificar límite antes de procesar
    @register_resource_usage('product')  # Registrar uso después de crear exitosamente
    def post(self, request, usuario_id):
        data = request.data.copy()
        nombre_producto = data.get('nombre')
        
        # DEBUG: Imprimir información de la solicitud
        print("Datos recibidos:", request.data)
        print("Archivos recibidos:", request.FILES)
        
        # Verificar si hay una imagen y procesarla
        if 'imagen' in request.FILES:
            imagen = request.FILES['imagen']
            print(f"Imagen recibida: {imagen.name}")
            # Asegurar que la imagen se añada correctamente a los datos
            data['imagen'] = imagen

        # Verificar si el producto ya existe para ese usuario
        producto_existente = Producto.objects.filter(nombre__iexact=nombre_producto, usuario_id=usuario_id).first()

        if producto_existente:
            # Si existe, sumamos el stock pero NO incrementamos el contador
            # porque no estamos creando un nuevo producto
            inventario = producto_existente.inventario
            stock_adicional = int(data.get('stock_inicial', 0))  # Si no viene, usa 0

            inventario.stock += stock_adicional
            inventario.save()

            logger = get_logger_por_usuario(usuario_id)
            logger.info(f"Producto ya existía. Stock actualizado: {producto_existente.nombre} | Usuario: {producto_existente.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")

            serializer = ProductoSerializer(producto_existente)
            return Response({
                "mensaje": "Producto ya existía. Stock actualizado.",
                "producto": serializer.data
            }, status=status.HTTP_200_OK)  # Nota: esto no activará register_resource_usage

        # Si no existe, se crea normalmente
        data['usuario_id'] = usuario_id
        serializer = ProductoSerializer(data=data)
        if serializer.is_valid():
            producto = serializer.save()
            
            # Recargar el producto para asegurarnos de tener la URL de la imagen
            producto.refresh_from_db()
            
            # Log en archivo .log
            logger = get_logger_por_usuario(usuario_id)
            logger.info(f"Producto creado: {producto.nombre} | Usuario: {producto.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")
            # Usar el serializador para devolver todos los datos actualizados
            serializer = ProductoSerializer(producto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Errores de validación:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
       
    


class ProductoDetalleVista(APIView):
    """
    Vista para obtener, actualizar o eliminar un producto específico por ID, restringido a empresa.
    """

    def get(self, request, usuario_id, pk):
        """
        Obtener los datos de un producto por su ID y empresa (GET)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data)

    def put(self, request, usuario_id, pk):
        """
        Actualizar todos los datos de un producto por ID y empresa (PUT)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        data = request.data.copy()
        data['usuario_id'] = usuario_id
        
        # Verificar si hay una nueva imagen
        if 'imagen' in request.FILES:
            imagen = request.FILES['imagen']
            print(f"Actualizando imagen: {imagen.name}")
            data['imagen'] = imagen
        
        serializer = ProductoSerializer(producto, data=data)
        if serializer.is_valid():
            serializer.save()

            logger = get_logger_por_usuario(usuario_id)
            logger.info(f"Producto actualizado: {producto.nombre} | Usuario: {producto.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")
            return Response(serializer.data)
    
        print("Errores de validación en PUT:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, usuario_id, pk):
        """
        Eliminar un producto por su ID y empresa (DELETE)
        """
        producto = get_object_or_404(Producto, pk=pk, usuario_id=usuario_id)
        producto.delete()

        logger = get_logger_por_usuario(usuario_id)
        logger.info(f"Producto eliminado: {producto.nombre} | Usuario: {producto.usuario.correo} | IP: {request.META.get('REMOTE_ADDR')}")

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductosPorCategoriaView(APIView):
    """
    Vista para listar productos de una empresa por categoría.
    """

    def get(self, request, usuario_id, valor):
        """
        Obtener productos de una categoría específica (ID o nombre) para una empresa (GET)
        """
        try:
            # Buscar la categoría dentro de la empresa
            try:
                categoria = Categoria.objects.get(id=valor, usuario_id=usuario_id)
            except Categoria.DoesNotExist:
                categoria = Categoria.objects.get(nombre__iexact=valor, usuario_id=usuario_id)

            productos = Producto.objects.filter(categoria=categoria, usuario_id=usuario_id)
            serializer = ProductoSerializer(productos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Categoria.DoesNotExist:
            return Response({'error': 'Categoría no encontrada'}, status=status.HTTP_404_NOT_FOUND)