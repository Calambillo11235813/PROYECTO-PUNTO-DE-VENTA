from django.urls import path
from Productos.controllers.producto_controller import (ProductoListaCrearVista, ProductoDetalleVista, ProductosPorCategoriaView)
from Productos.controllers.categoria_controller import (CategoriaListaCrearVista, CategoriaDetalleVista)
from Productos.controllers.inventario_controller import (InventarioListaCrearVista, InventarioDetalleVista)
from Productos.controllers.reporte_controller import ReporteProductosView  # Nueva importación
from Productos.controllers.proveedor_controller import ProveedorListaCrearVista, ProveedorDetalleVista
from Productos.controllers.pedido_proveedor_controller import PedidoProveedorCreateView, PedidoProveedorDeleteView

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

    path('proveedor/usuario/<int:usuario_id>/', ProveedorListaCrearVista.as_view(), name='proveedor-list-create'),
    path('proveedor/<int:pk>/usuario/<int:usuario_id>/', ProveedorDetalleVista.as_view(), name='proveedor-detail'),

    path('pedido-proveedor/usuario/<int:usuario_id>/', PedidoProveedorCreateView.as_view(), name='pedido-proveedor-create'),
    path('pedido-proveedor/<int:pk>/', PedidoProveedorDeleteView.as_view(), name='pedido-proveedor-delete'),
]
