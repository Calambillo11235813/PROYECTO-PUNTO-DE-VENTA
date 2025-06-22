from django.urls import path
from Productos.controllers.producto_controller import (ProductoListaCrearVista, ProductoDetalleVista, ProductosPorCategoriaView)
from Productos.controllers.categoria_controller import (CategoriaListaCrearVista, CategoriaDetalleVista)
from Productos.controllers.inventario_controller import (InventarioListaCrearVista, InventarioDetalleVista)
from Productos.controllers.reporte_controller import ReporteProductosView  # Nueva importación

urlpatterns = [
    path('crear/usuario/<int:usuario_id>/', ProductoListaCrearVista.as_view(), name='producto-lista-crear'),
    # Productos por usuario
    path('crear/usuario/<int:usuario_id>/', ProductoListaCrearVista.as_view(), name='producto-lista-crear'),
    # Productos por usuario y sucursal (ruta explícita)
    path('crear/usuario/<int:usuario_id>/sucursal/<int:sucursal_id>/', ProductoListaCrearVista.as_view(), name='producto-lista-crear-sucursal'),
    
    path('detalles/usuario/<int:usuario_id>/<int:pk>/', ProductoDetalleVista.as_view(), name='producto-detalle'),
    
    path('PorCategoria/usuario/<int:usuario_id>/categoria/<str:valor>/', ProductosPorCategoriaView.as_view(), name='productos-por-categoria'),
    path('categoria/usuario/<int:usuario_id>/', CategoriaListaCrearVista.as_view(), name='categorias-list-create'),
    path('categoria/usuario/<int:usuario_id>/<int:pk>/', CategoriaDetalleVista.as_view(), name='categorias-detail'),
    
    path('inventarios/', InventarioListaCrearVista.as_view(), name='inventario-listar-crear'),
    path('inventarios/<int:pk>/', InventarioDetalleVista.as_view(), name='inventario-detalle'),
    
    # Nueva ruta para reportes
    path('reportes/usuario/<int:usuario_id>/', ReporteProductosView.as_view(), name='reporte-productos'),
]
