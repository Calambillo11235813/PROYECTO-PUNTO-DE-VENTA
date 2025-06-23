from django.urls import path
from Sucursales.views import SucursalListCreateAPIView, SucursalDetailAPIView
from Sucursales.views import SucursalesPorUsuarioAPIView


urlpatterns = [
    path('sucursales/', SucursalListCreateAPIView.as_view(), name='sucursal-lista-crear'),
    path('sucursales/<int:sucursal_id>/', SucursalDetailAPIView.as_view(), name='sucursal-detail'),
    
    # Nuevas rutas
    path('usuario/<int:usuario_id>/', SucursalesPorUsuarioAPIView.as_view(), name='sucursales-por-usuario'),


]