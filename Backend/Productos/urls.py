from django.urls import path
from Productos.controllers.producto_controller import (ProductoListaCrearVista, ProductoDetalleVista, ProductosPorCategoriaView)
from Productos.controllers.categoria_controller import (CategoriaListaCrearVista, CategoriaDetalleVista)
from Productos.controllers.inventario_controller import (InventarioListaCrearVista, InventarioDetalleVista)

urlpatterns = [
    path('productos/<int:empresa_id>/', ProductoListaCrearVista.as_view(), name='producto-lista-crear'),
    path('productos/<int:empresa_id>/<int:pk>/', ProductoDetalleVista.as_view(), name='producto-detalle'),
    path('productos/<int:empresa_id>/categoria/<str:valor>/', ProductosPorCategoriaView.as_view(), name='productos-por-categoria'),
    path('categorias/<int:empresa_id>/', CategoriaListaCrearVista.as_view(), name='categorias-list-create'),
    path('categorias/<int:empresa_id>/<int:pk>/', CategoriaDetalleVista.as_view(), name='categorias-detail'),
    path('inventarios/', InventarioListaCrearVista.as_view(), name='inventario-listar-crear'),
    path('inventarios/<int:pk>/', InventarioDetalleVista.as_view(), name='inventario-detalle'),
    
]
