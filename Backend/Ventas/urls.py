from django.urls import path
from Ventas.controllers.estado_controller import EstadoListCreateAPIView, EstadoRetrieveUpdateDestroyAPIView
from Ventas.controllers.tipo_venta_controller import TipoVentaListCreateAPIView, TipoVentaRetrieveUpdateDestroyAPIView
from Ventas.controllers.pedido_controller import PedidoListCreateAPIView, PedidoRetrieveUpdateDestroyAPIView
from Ventas.controllers.venta_controller import VentaListCreateAPIView, VentaRetrieveUpdateDestroyAPIView

urlpatterns = [
    path('estados/<int:empresa_id>/', EstadoListCreateAPIView.as_view(), name='estado-lista-crear'),
    path('estados/<int:empresa_id>/<int:pk>/', EstadoRetrieveUpdateDestroyAPIView.as_view(), name='estado-detalle'),
    path('tipos-venta/<int:empresa_id>/', TipoVentaListCreateAPIView.as_view(), name='tipo-venta-lista-crear'),
    path('tipos-venta/<int:empresa_id>/<int:pk>/', TipoVentaRetrieveUpdateDestroyAPIView.as_view(), name='tipo-venta-detalle'),
    path('pedidos/<int:empresa_id>/', PedidoListCreateAPIView.as_view(), name='pedido-lista-crear'),
    path('pedidos/<int:empresa_id>/<int:pk>/', PedidoRetrieveUpdateDestroyAPIView.as_view(), name='pedido-detalle'),
    path('ventas/<int:empresa_id>/', VentaListCreateAPIView.as_view(), name='venta-lista-crear'),
    path('ventas/<int:empresa_id>/<int:pk>/', VentaRetrieveUpdateDestroyAPIView.as_view(), name='venta-detalle'),
]
