from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from accounts.models import Plan, Suscripcion, HistorialSuscripcion
from accounts.serializers import (
    PlanSerializer, 
    SuscripcionSerializer, 
    SuscripcionCreateSerializer,
    HistorialSuscripcionSerializer
)
from rest_framework.permissions import IsAuthenticated


class PlanListView(APIView):
    """
    Listar todos los planes disponibles
    """
    def get(self, request):
        try:
            planes = Plan.objects.filter(activo=True).order_by('precio')
            serializer = PlanSerializer(planes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Error al obtener planes: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlanDetailView(APIView):
    """
    Obtener detalles de un plan específico
    """
    def get(self, request, plan_id):
        try:
            plan = Plan.objects.get(id=plan_id, activo=True)
            serializer = PlanSerializer(plan)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Plan.DoesNotExist:
            return Response(
                {'error': 'Plan no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al obtener plan: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SuscripcionUsuarioView(APIView):
    """
    Gestionar suscripción de un usuario específico
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, usuario_id):
        """Obtener suscripción actual del usuario"""
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            serializer = SuscripcionSerializer(suscripcion)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Suscripcion.DoesNotExist:
            return Response(
                {'error': 'Usuario no tiene suscripción activa'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al obtener suscripción: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, usuario_id):
        """Crear nueva suscripción para el usuario"""
        try:
            # Verificar si ya tiene una suscripción
            if Suscripcion.objects.filter(usuario_id=usuario_id).exists():
                return Response(
                    {'error': 'El usuario ya tiene una suscripción'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = request.data.copy()
            data['usuario'] = usuario_id
            
            serializer = SuscripcionCreateSerializer(data=data)
            if serializer.is_valid():
                suscripcion = serializer.save()
                response_serializer = SuscripcionSerializer(suscripcion)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Error al crear suscripción: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, usuario_id):
        """Cambiar plan de suscripción"""
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            plan_anterior = suscripcion.plan
            
            # Actualizar plan
            nuevo_plan_id = request.data.get('plan')
            if nuevo_plan_id:
                nuevo_plan = Plan.objects.get(id=nuevo_plan_id, activo=True)
                
                # Crear registro en historial
                HistorialSuscripcion.objects.create(
                    suscripcion=suscripcion,
                    plan_anterior=plan_anterior,
                    plan_nuevo=nuevo_plan,
                    motivo=request.data.get('motivo', 'Cambio de plan'),
                    realizado_por=request.user.nombre if hasattr(request.user, 'nombre') else 'Sistema'
                )
                
                suscripcion.plan = nuevo_plan
                suscripcion.save()
            
            serializer = SuscripcionSerializer(suscripcion)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Suscripcion.DoesNotExist:
            return Response(
                {'error': 'Suscripción no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Plan.DoesNotExist:
            return Response(
                {'error': 'Plan no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar suscripción: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerificarLimitesView(APIView):
    """
    Verificar límites del plan actual del usuario
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, usuario_id):
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            
            if not suscripcion.esta_activa:
                return Response(
                    {'error': 'Suscripción no está activa'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            limites = {
                'plan_nombre': suscripcion.plan.nombre,
                'limites': {
                    'productos': {
                        'maximo': suscripcion.plan.max_productos,
                        'utilizados': suscripcion.productos_utilizados,
                        'disponibles': suscripcion.plan.max_productos - suscripcion.productos_utilizados if suscripcion.plan.max_productos > 0 else 'ilimitado',
                        'puede_agregar': suscripcion.verificar_limite_productos()
                    },
                    'empleados': {
                        'maximo': suscripcion.plan.max_empleados,
                        'utilizados': suscripcion.empleados_utilizados,
                        'disponibles': suscripcion.plan.max_empleados - suscripcion.empleados_utilizados,
                        'puede_agregar': suscripcion.verificar_limite_empleados()
                    },
                    'ventas_mensuales': {
                        'maximo': suscripcion.plan.max_ventas_mensuales,
                        'utilizados': suscripcion.ventas_mes_actual,
                        'disponibles': suscripcion.plan.max_ventas_mensuales - suscripcion.ventas_mes_actual if suscripcion.plan.max_ventas_mensuales > 0 else 'ilimitado',
                        'puede_agregar': suscripcion.verificar_limite_ventas_mensuales()
                    },
                    'sucursales': {
                        'maximo': suscripcion.plan.max_sucursales,
                        'utilizados': suscripcion.sucursales_utilizadas,
                        'disponibles': suscripcion.plan.max_sucursales - suscripcion.sucursales_utilizadas,
                        'puede_agregar': suscripcion.verificar_limite_sucursales()
                    },
                    'clientes': {
                        'maximo': suscripcion.plan.max_clientes,
                        'utilizados': suscripcion.clientes_utilizados,
                        'disponibles': suscripcion.plan.max_clientes - suscripcion.clientes_utilizados if suscripcion.plan.max_clientes > 0 else 'ilimitado',
                        'puede_agregar': suscripcion.verificar_limite_clientes()
                    }
                },
                'funcionalidades': {
                    'inventario_avanzado': suscripcion.plan.tiene_inventario_avanzado,
                    'reportes_detallados': suscripcion.plan.tiene_reportes_detallados,
                    'multi_sucursal': suscripcion.plan.tiene_multi_sucursal,
                    'backup_automatico': suscripcion.plan.tiene_backup_automatico,
                    'api_acceso': suscripcion.plan.tiene_api_acceso,
                    'soporte_prioritario': suscripcion.plan.tiene_soporte_prioritario,
                    'integraciones': suscripcion.plan.tiene_integraciones,
                    'facturacion_electronica': suscripcion.plan.tiene_facturacion_electronica
                }
            }
            
            return Response(limites, status=status.HTTP_200_OK)
        except Suscripcion.DoesNotExist:
            return Response(
                {'error': 'Usuario no tiene suscripción'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al verificar límites: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HistorialSuscripcionView(APIView):
    """
    Obtener historial de cambios de suscripción
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, usuario_id):
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            historial = HistorialSuscripcion.objects.filter(suscripcion=suscripcion)
            serializer = HistorialSuscripcionSerializer(historial, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Suscripcion.DoesNotExist:
            return Response(
                {'error': 'Suscripción no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al obtener historial: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )