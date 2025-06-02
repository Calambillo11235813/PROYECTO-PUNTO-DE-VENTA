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
from rest_framework.permissions import IsAuthenticated, AllowAny
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
            print(f"🔍 Datos recibidos para crear suscripción:")
            print(f"   - usuario_id: {usuario_id}")
            print(f"   - request.data: {request.data}")
            
            # Verificar si ya tiene una suscripción
            if Suscripcion.objects.filter(usuario_id=usuario_id).exists():
                print(f"❌ Usuario {usuario_id} ya tiene una suscripción")
                return Response(
                    {'error': 'El usuario ya tiene una suscripción'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar que el usuario existe
            try:
                from accounts.models import Usuario
                usuario = Usuario.objects.get(id=usuario_id)
                print(f"✅ Usuario encontrado: {usuario.correo}")
                print(f"📋 Usuario antes de actualizar - Plan actual: {usuario.plan}")
            except Usuario.DoesNotExist:
                print(f"❌ Usuario {usuario_id} no existe")
                return Response(
                    {'error': 'Usuario no encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar que el plan existe
            plan_id = request.data.get('plan')
            if not plan_id:
                return Response(
                    {'error': 'ID del plan es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                plan = Plan.objects.get(id=plan_id, activo=True)
                print(f"✅ Plan encontrado: {plan.nombre} - ${plan.precio}")
            except Plan.DoesNotExist:
                print(f"❌ Plan {plan_id} no existe o no está activo")
                return Response(
                    {'error': 'Plan no encontrado o no está activo'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Preparar datos para el serializer
            data = request.data.copy()
            data['usuario'] = usuario_id
            
            print(f"📋 Datos preparados para serializer: {data}")
            
            # Validar con serializer
            serializer = SuscripcionCreateSerializer(data=data)
            if not serializer.is_valid():
                print(f"❌ Errores de validación: {serializer.errors}")
                return Response(
                    {
                        'error': 'Datos inválidos',
                        'details': serializer.errors
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear suscripción
            suscripcion = serializer.save()
            print(f"✅ Suscripción creada exitosamente: ID {suscripcion.id}")
            
            # ✅ NUEVA LÓGICA: Actualizar el modelo Usuario con datos del plan
            try:
                print(f"🔄 Actualizando datos del usuario con plan y fecha de expiración...")
                
                # Actualizar el campo plan (como string) y fecha_expiracion en el modelo Usuario
                usuario.plan = plan.nombre  # ✅ Guardar el NOMBRE del plan como string
                usuario.fecha_expiracion = suscripcion.fecha_expiracion  # ✅ Asignar fecha de expiración
                usuario.save()
                
                print(f"✅ Usuario actualizado exitosamente:")
                print(f"   - Plan (string): '{usuario.plan}'")
                print(f"   - Fecha expiración: {usuario.fecha_expiracion}")
                print(f"   - Plan ID en suscripción: {suscripcion.plan.id}")
                
            except Exception as update_error:
                print(f"❌ Error actualizando usuario: {update_error}")
                import traceback
                traceback.print_exc()
                
                # Opcional: rollback de la suscripción si falla la actualización del usuario
                # suscripcion.delete()
                return Response(
                    {'error': f'Error actualizando usuario: {str(update_error)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Retornar respuesta con datos actualizados
            response_serializer = SuscripcionSerializer(suscripcion)
            response_data = response_serializer.data
            
            # Agregar datos del usuario actualizado a la respuesta
            response_data['usuario_actualizado'] = {
                'id': usuario.id,
                'plan_nombre': usuario.plan,  # Campo string en Usuario
                'fecha_expiracion': usuario.fecha_expiracion,
                'plan_id_suscripcion': suscripcion.plan.id,  # ID en la suscripción
                'sincronizado': True
            }
            
            print(f"✅ Respuesta final preparada con usuario actualizado")
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print(f"❌ Error inesperado: {str(e)}")
            import traceback
            traceback.print_exc()
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


class UsuarioConPlanView(APIView):
    """
    Obtener datos completos del usuario incluyendo plan y suscripción
    """
    permission_classes = [AllowAny]  # Cambiar según tus necesidades
    
    def get(self, request, usuario_id):
        try:
            from accounts.models import Usuario
            
            # Obtener usuario
            usuario = Usuario.objects.get(id=usuario_id)
            
            # Obtener suscripción activa
            suscripcion = None
            try:
                suscripcion = Suscripcion.objects.select_related('plan').get(usuario_id=usuario_id)
            except Suscripcion.DoesNotExist:
                pass
            
            # Preparar respuesta
            usuario_data = {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'correo': usuario.correo,
                'direccion': usuario.direccion,
                'nombre_empresa': usuario.nombre_empresa,
                'nit_empresa': usuario.nit_empresa,
                'estado': usuario.estado,
                'is_staff': usuario.is_staff,
                'fecha_expiracion': usuario.fecha_expiracion,
                'plan': usuario.plan,  # ✅ Campo string del usuario
                'plan_data': {
                    'id': suscripcion.plan.id,
                    'nombre': suscripcion.plan.nombre,
                    'precio': suscripcion.plan.precio,
                    'descripcion': suscripcion.plan.descripcion
                } if suscripcion else None,
                'suscripcion': {
                    'id': suscripcion.id,
                    'fecha_inicio': suscripcion.fecha_inicio,
                    'fecha_expiracion': suscripcion.fecha_expiracion,
                    'metodo_pago': suscripcion.metodo_pago,
                    'monto_pagado': suscripcion.monto_pagado,
                    'referencia_pago': suscripcion.referencia_pago,
                    'esta_activa': suscripcion.esta_activa
                } if suscripcion else None,
                # ✅ Información de sincronización
                'sincronizacion': {
                    'plan_usuario': usuario.plan,
                    'plan_suscripcion': suscripcion.plan.nombre if suscripcion else None,
                    'esta_sincronizado': usuario.plan == (suscripcion.plan.nombre if suscripcion else None)
                }
            }
            
            return Response(usuario_data, status=status.HTTP_200_OK)
            
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Error obteniendo usuario: {str(e)}")
            return Response(
                {'error': f'Error al obtener usuario: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SincronizarUsuarioPlanView(APIView):
    """
    Sincronizar el campo plan del usuario con su suscripción activa
    Útil para casos donde ya existen suscripciones pero el usuario no tiene el plan actualizado
    """
   # permission_classes = [AllowAny]  # Cambiar según tus necesidades
    
    def post(self, request, usuario_id):
        """
        Sincronizar plan del usuario basado en su suscripción activa
        """
        try:
            from accounts.models import Usuario
            
            # Obtener usuario
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                print(f"✅ Usuario encontrado: {usuario.correo}")
                print(f"📋 Plan actual en usuario: '{usuario.plan}'")
            except Usuario.DoesNotExist:
                return Response(
                    {'error': 'Usuario no encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener suscripción activa
            try:
                suscripcion = Suscripcion.objects.select_related('plan').get(usuario_id=usuario_id)
                print(f"✅ Suscripción encontrada: ID {suscripcion.id}")
                print(f"📋 Plan en suscripción: {suscripcion.plan.nombre} (ID: {suscripcion.plan.id})")
            except Suscripcion.DoesNotExist:
                return Response(
                    {'error': 'Usuario no tiene suscripción activa'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar si necesita sincronización
            plan_usuario_actual = usuario.plan
            plan_suscripcion = suscripcion.plan.nombre
            
            if plan_usuario_actual == plan_suscripcion:
                return Response({
                    'mensaje': 'Usuario ya está sincronizado',
                    'plan_actual': plan_usuario_actual,
                    'sincronizado': True
                }, status=status.HTTP_200_OK)
            
            # Realizar sincronización
            print(f"🔄 Sincronizando usuario...")
            print(f"   - Plan anterior: '{plan_usuario_actual}' -> Plan nuevo: '{plan_suscripcion}'")
            
            usuario.plan = plan_suscripcion
            usuario.fecha_expiracion = suscripcion.fecha_expiracion
            usuario.save()
            
            print(f"✅ Sincronización completada:")
            print(f"   - Plan: '{usuario.plan}'")
            print(f"   - Fecha expiración: {usuario.fecha_expiracion}")
            
            return Response({
                'mensaje': 'Usuario sincronizado exitosamente',
                'cambios': {
                    'plan_anterior': plan_usuario_actual,
                    'plan_nuevo': usuario.plan,
                    'fecha_expiracion': usuario.fecha_expiracion
                },
                'sincronizado': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error sincronizando usuario: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error al sincronizar usuario: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request, usuario_id):
        """
        Verificar estado de sincronización del usuario
        """
        try:
            from accounts.models import Usuario
            
            # Obtener usuario
            usuario = Usuario.objects.get(id=usuario_id)
            
            # Obtener suscripción
            try:
                suscripcion = Suscripcion.objects.select_related('plan').get(usuario_id=usuario_id)
            except Suscripcion.DoesNotExist:
                return Response({
                    'sincronizado': False,
                    'razon': 'No tiene suscripción activa',
                    'plan_usuario': usuario.plan,
                    'tiene_suscripcion': False
                }, status=status.HTTP_200_OK)
            
            # Verificar sincronización
            plan_usuario = usuario.plan
            plan_suscripcion = suscripcion.plan.nombre
            esta_sincronizado = plan_usuario == plan_suscripcion
            
            return Response({
                'sincronizado': esta_sincronizado,
                'plan_usuario': plan_usuario,
                'plan_suscripcion': plan_suscripcion,
                'fecha_expiracion_usuario': usuario.fecha_expiracion,
                'fecha_expiracion_suscripcion': suscripcion.fecha_expiracion,
                'tiene_suscripcion': True,
                'suscripcion_activa': suscripcion.esta_activa
            }, status=status.HTTP_200_OK)
            
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error verificando sincronización: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )