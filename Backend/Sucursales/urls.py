from django.urls import path
from Sucursales.views import SucursalListCreateAPIView, SucursalDetailAPIView

urlpatterns = [
    path('sucursales/', SucursalListCreateAPIView.as_view(), name='sucursal-lista-crear'),
    path('sucursales/<int:sucursal_id>/', SucursalDetailAPIView.as_view(), name='sucursal-detail'),
]