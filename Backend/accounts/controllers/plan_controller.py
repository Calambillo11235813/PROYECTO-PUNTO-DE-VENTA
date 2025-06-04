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
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import datetime


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
    
    Ejemplo de JSON a enviar:
    {
        "plan": 1,
        "fecha_inicio": "2024-01-01T00:00:00Z",
        "fecha_expiracion": "2024-12-31T23:59:59Z",
        "metodo_pago": "tarjeta",
        "monto_pagado": 299.00,
        "referencia_pago": "TXN123456789"
    }
    
    Campos obligatorios:
    - plan: ID del plan (1=básico, 2=intermedio, 3=avanzado)
    - fecha_inicio: Fecha y hora de inicio de la suscripción
    - fecha_expiracion: Fecha y hora de expiración
    
    Campos opcionales:
    - metodo_pago: "tarjeta", "transferencia", "efectivo", "otro"
    - monto_pagado: Monto pagado por la suscripción
    - referencia_pago: Referencia o ID de la transacción
    """
    # REMOVIDO: permission_classes = [IsAuthenticated]
    
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
        """
        Actualizar suscripción del usuario
        
        Ejemplo de JSON para renovar (cambiar fecha):
        {
            "fecha_expiracion": "2025-12-31T23:59:59Z"
        }
        """
        try:
            suscripcion = Suscripcion.objects.get(usuario_id=usuario_id)
            plan_anterior = suscripcion.plan
            
            # Variables para tracking de cambios
            cambio_plan = False
            cambio_fecha = False
            
            # Actualizar plan si se proporciona
            nuevo_plan_id = request.data.get('plan')
            if nuevo_plan_id and nuevo_plan_id != suscripcion.plan.id:
                nuevo_plan = Plan.objects.get(id=nuevo_plan_id, activo=True)
                suscripcion.plan = nuevo_plan
                cambio_plan = True
            
            # CORREGIR: Actualizar fecha de expiración si se proporciona
            nueva_fecha_expiracion = request.data.get('fecha_expiracion')
            if nueva_fecha_expiracion:
                # Convertir string a datetime si es necesario
                if isinstance(nueva_fecha_expiracion, str):
                    fecha_convertida = parse_datetime(nueva_fecha_expiracion)
                    if fecha_convertida is None:
                        return Response(
                            {'error': 'Formato de fecha inválido. Use formato ISO: YYYY-MM-DDTHH:MM:SSZ'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    suscripcion.fecha_expiracion = fecha_convertida
                else:
                    suscripcion.fecha_expiracion = nueva_fecha_expiracion
                cambio_fecha = True
            
            # CORREGIR: Actualizar fecha de inicio si se proporciona
            nueva_fecha_inicio = request.data.get('fecha_inicio')
            if nueva_fecha_inicio:
                if isinstance(nueva_fecha_inicio, str):
                    fecha_convertida = parse_datetime(nueva_fecha_inicio)
                    if fecha_convertida is None:
                        return Response(
                            {'error': 'Formato de fecha de inicio inválido. Use formato ISO: YYYY-MM-DDTHH:MM:SSZ'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    suscripcion.fecha_inicio = fecha_convertida
                else:
                    suscripcion.fecha_inicio = nueva_fecha_inicio
            
            # Actualizar otros campos opcionales
            if 'metodo_pago' in request.data:
                suscripcion.metodo_pago = request.data.get('metodo_pago')
            
            if 'monto_pagado' in request.data:
                suscripcion.monto_pagado = request.data.get('monto_pagado')
            
            if 'referencia_pago' in request.data:
                suscripcion.referencia_pago = request.data.get('referencia_pago')
            
            # Determinar motivo del cambio
            motivo = request.data.get('motivo', '')
            if not motivo:
                if cambio_plan and cambio_fecha:
                    motivo = 'Cambio de plan y renovación'
                elif cambio_plan:
                    motivo = 'Cambio de plan'
                elif cambio_fecha:
                    motivo = 'Renovación de suscripción'
                else:
                    motivo = 'Actualización de suscripción'
            
            # Guardar cambios
            suscripcion.save()
            
            # Crear registro en historial solo si cambió el plan
            if cambio_plan:
                HistorialSuscripcion.objects.create(
                    suscripcion=suscripcion,
                    plan_anterior=plan_anterior,
                    plan_nuevo=suscripcion.plan,
                    motivo=motivo,
                    realizado_por='Sistema'
                )
            
            # Preparar respuesta
            serializer = SuscripcionSerializer(suscripcion)
            response_data = {
                'mensaje': 'Suscripción actualizada exitosamente',
                'cambios': {
                    'plan_actualizado': cambio_plan,
                    'fecha_actualizada': cambio_fecha,
                    'motivo': motivo
                },
                'suscripcion': serializer.data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
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
        except ValueError as e:
            return Response(
                {'error': f'Error en formato de datos: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
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
    # REMOVIDO: permission_classes = [IsAuthenticated]
    
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
    # REMOVIDO: permission_classes = [IsAuthenticated]
    
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