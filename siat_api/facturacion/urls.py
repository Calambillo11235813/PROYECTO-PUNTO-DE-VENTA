from django.urls import path
from . import views

urlpatterns = [
    # Autenticación
    path('auth/token/', views.generar_token, name='generar_token'),
    
    # Códigos SIAT
    path('codigos/cuis/', views.generar_cuis, name='generar_cuis'),
    path('codigos/cufd/', views.generar_cufd, name='generar_cufd'),
    
    # Facturación
    path('facturacion/recepcion/', views.recepcion_factura, name='recepcion_factura'),
    path('facturacion/recepcion-base64/', views.recepcion_factura_base64, name='recepcion_factura_base64'),
    path('facturacion/verificacion/', views.verificacion_estado_factura, name='verificacion_estado_factura'),

     # ✅ NUEVAS URLs PARA CRUD DE USUARIOS
    path('usuarios/', views.UsuarioSIATAPIView.as_view(), name='usuarios-list'),
    path('usuarios/<str:nit>/', views.UsuarioSIATAPIView.as_view(), name='usuarios-detail'),
    path('limpiar-datos/', views.limpiar_datos_prueba, name='limpiar-datos'),
]
