from django.urls import path
from Ventas.controllers.tipo_venta_controller import (TipoVentaListCreateAPIView, TipoVentaRetrieveUpdateDestroyAPIView)
from Ventas.controllers.cliente_controller import (ClienteListCreateAPIView, ClienteDetailAPIView, ClientesBySucursalAPIView)
from Ventas.controllers.pedido_controller import PedidoListCreateAPIView
from Ventas.controllers.pedido_controller import PedidoListCreateAPIView, PedidoDetailAPIView
from Ventas.controllers.tipo_pago_controller import (TipoPagoListCreateAPIView, TipoPagoRetrieveUpdateDestroyAPIView)
from Ventas.controllers.caja_controller import AbrirCajaAPIView, CajaDeleteAPIView, CerrarCajaAPIView, CajaActualAPIView, CajaTransaccionesEfectivoAPIView
from Ventas.controllers.movimiento_controller import MovimientoEfectivoAPIView
from Ventas.controllers.reporte_controller import (
    ReporteVentasView, ReporteCajaView, ReporteClientesView,
    ReporteMovimientosView, ReporteProductosView
)
from Ventas.controllers.facturacion_controller import (
    FacturarPedidoAPIView,
    VerificarEstadoFacturaAPIView,
    TestSIATConnectionAPIView
)
from Ventas.controllers.lista_facturas_controller import ListaFacturasUsuarioAPIView
from Ventas.controllers.anular_factura_controller import AnularFacturaAPIView
from Ventas.controllers.estado_controller import (
    EstadoListCreateAPIView,
    EstadoRetrieveUpdateDestroyAPIView
)


urlpatterns = [
    # Tipos de venta (globales)
    path('tipos-venta/', TipoVentaListCreateAPIView.as_view(), name='tipo-venta-lista-crear'),
    path('tipos-venta/<int:pk>/', TipoVentaRetrieveUpdateDestroyAPIView.as_view(), name='tipo-venta-detalle'),

    # Estados (globales)
    path('estados/', EstadoListCreateAPIView.as_view(), name='estado-lista-crear'),
    path('estados/<int:pk>/', EstadoRetrieveUpdateDestroyAPIView.as_view(), name='estado-detalle'),

    # Pedidos por usuario (con filtro opcional de sucursal via query params: ?sucursal_id=1)
    path('pedidos/usuario/<int:usuario_id>/', PedidoListCreateAPIView.as_view(), name='pedido-lista-crear'),
    path('pedidos/usuario/<int:usuario_id>/<int:pedido_id>/', PedidoDetailAPIView.as_view(), name='pedido-detail'),

    # Clientes por usuario
    path('clientes/usuario/<int:usuario_id>/', ClienteListCreateAPIView.as_view(), name='cliente-lista-crear'),
    path('clientes/usuario/<int:usuario_id>/<int:cliente_id>/', ClienteDetailAPIView.as_view(), name='cliente-detail'),
    path('clientes/usuario/<int:usuario_id>/sucursal/<int:sucursal_id>/', ClientesBySucursalAPIView.as_view(), name='clientes-por-sucursal'),

    # Tipos de pago   
    path('tipo-pago/', TipoPagoListCreateAPIView.as_view(), name='tipo-pago-list-create'),
    path('tipo-pago/<int:pk>/', TipoPagoRetrieveUpdateDestroyAPIView.as_view(), name='tipo-pago-detail'),

    # Caja (con filtro opcional de sucursal via query params: ?sucursal_id=1)GET /api/ventas/pedidos/usuario/1/?sucursal_id=1
    path('caja/abrir/<int:usuario_id>/', AbrirCajaAPIView.as_view(), name='abrir-caja'),
    path('caja/cerrar/<int:usuario_id>/', CerrarCajaAPIView.as_view(), name='cerrar-caja'),
    path('caja/actual/<int:usuario_id>/', CajaActualAPIView.as_view(), name='caja-actual'),
    path('caja/sucursal/<int:sucursal_id>/', CajaActualAPIView.as_view(), name='caja-por-sucursal'),
    
    
    # Transacciones en efectivo por caja
    path('caja/<int:caja_id>/transacciones/efectivo/', CajaTransaccionesEfectivoAPIView.as_view(), name='transacciones-efectivo-caja'),
    
    # Movimientos de efectivo en caja
    path('caja/<int:caja_id>/movimientos/', MovimientoEfectivoAPIView.as_view(), name='movimientos-caja'),
    
    # REPORTES (con filtro opcional de sucursal via query params: ?sucursal_id=1)
    path('reportes/ventas/usuario/<int:usuario_id>/', ReporteVentasView.as_view(), name='reporte-ventas'),
    path('reportes/caja/usuario/<int:usuario_id>/', ReporteCajaView.as_view(), name='reporte-caja'),
    path('reportes/clientes/usuario/<int:usuario_id>/', ReporteClientesView.as_view(), name='reporte-clientes'),
    path('reportes/movimientos/usuario/<int:usuario_id>/', ReporteMovimientosView.as_view(), name='reporte-movimientos'),

   # Facturación electrónica
    path('pedidos/usuario/<int:usuario_id>/<int:pedido_id>/facturar/', FacturarPedidoAPIView.as_view(), name='facturar-pedido'),
    path('pedidos/usuario/<int:usuario_id>/<int:pedido_id>/estado-factura/', VerificarEstadoFacturaAPIView.as_view(), name='verificar-estado-factura'),
      # ✅ AGREGAR ESTA LÍNEA
    path('test-siat-connection/<int:usuario_id>/', TestSIATConnectionAPIView.as_view(), name='test-siat-connection'),

    # ✅ NUEVA URL para listar facturas
    path('facturas/usuario/<int:usuario_id>/', ListaFacturasUsuarioAPIView.as_view(), name='lista_facturas_usuario'),

    # ✅ URL para anular factura
    path('pedidos/usuario/<int:usuario_id>/<int:pedido_id>/factura/anular/', AnularFacturaAPIView.as_view(), name='anular_factura'),

]
