from django.urls import path
from Ventas.controllers.tipo_venta_controller import (TipoVentaListCreateAPIView, TipoVentaRetrieveUpdateDestroyAPIView)
from Ventas.controllers.estado_controller import (EstadoListCreateAPIView, EstadoRetrieveUpdateDestroyAPIView)
from Ventas.controllers.pedido_controller import PedidoListCreateAPIView
from Ventas.controllers.pedido_controller import PedidoListCreateAPIView, PedidoDetailAPIView
from Ventas.controllers.tipo_pago_controller import ( TipoPagoListCreateAPIView,TipoPagoRetrieveUpdateDestroyAPIView)


urlpatterns = [
    # Tipos de venta (globales)
    path('tipos-venta/', TipoVentaListCreateAPIView.as_view(), name='tipo-venta-lista-crear'),
    path('tipos-venta/<int:pk>/', TipoVentaRetrieveUpdateDestroyAPIView.as_view(), name='tipo-venta-detalle'),

    # Estados (globales)
    path('estados/', EstadoListCreateAPIView.as_view(), name='estado-lista-crear'),
    path('estados/<int:pk>/', EstadoRetrieveUpdateDestroyAPIView.as_view(), name='estado-detalle'),

    # Pedidos por usuario
    path('pedidos/usuario/<int:usuario_id>/', PedidoListCreateAPIView.as_view(), name='pedido-lista-crear'),
    path('pedidos/usuario/<int:usuario_id>/<int:pedido_id>/', PedidoDetailAPIView.as_view(), name='pedido-detail'),

    # Tipos de pago   
    path('tipo-pago/', TipoPagoListCreateAPIView.as_view(), name='tipo-pago-list-create'),
    path('tipo-pago/<int:pk>/', TipoPagoRetrieveUpdateDestroyAPIView.as_view(), name='tipo-pago-detail'),
]
