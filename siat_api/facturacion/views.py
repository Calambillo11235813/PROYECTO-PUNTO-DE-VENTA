from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
import base64
import gzip
import json
import traceback
import uuid
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import re

@api_view(['POST'])
def generar_token(request):
    data = request.data
    try:
        usuario = Usuario.objects.get(
            nit=data['username'],
            clave=data['password'],
            # asumimos que puedes ignorar códigoAmbiente por ahora
        )
        # validar códigoSistema (simulado aquí como constante)
        if data.get("codigoSistema") != "ABC123456":
            raise Exception("Código de sistema inválido")

        # generar y guardar token
        token = Token.objects.create(usuario=usuario, valor=str(uuid.uuid4()))

        return Response({"transaccion": True, "token": token.valor})
    except Usuario.DoesNotExist:
        return Response({
            "transaccion": False,
            "mensajesList": [{
                "codigo": 100,
                "mensaje": "Credenciales inválidas"
            }]
        }, status=401)
    except Exception as e:
        return Response({
            "transaccion": False,
            "mensajesList": [{
                "codigo": 101,
                "mensaje": str(e)
            }]
        }, status=400)


@api_view(['POST'])
def generar_cuis(request):
    try:
        token_header = request.headers.get("Authorization", "")
        if not token_header.startswith("Bearer "):
            return Response({
                "transaccion": False,
                "mensajesList": [{"codigo": 100, "mensaje": "Token no enviado correctamente"}]
            }, status=401)

        token_valor = token_header.replace("Bearer ", "").strip()
        token = Token.objects.get(valor=token_valor)

        data = request.data
        if token.usuario.nit != data["nit"]:
            raise Exception("NIT no coincide con el usuario del token")

        cuis = Cuis.objects.create(usuario=token.usuario)
        fecha_vigencia = timezone.now() + timedelta(days=90)

        return Response({
            "transaccion": True,
            "codigo": str(cuis.codigo),
            "fechaVigencia": fecha_vigencia.isoformat()
        })

    except Exception as e:
        import traceback
        print("❌ Error en generar_cuis:", str(e))
        traceback.print_exc()
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 102, "mensaje": str(e)}]
        }, status=500)


@api_view(['POST'])
def generar_cufd(request):
    data = request.data

    try:
        nit = data["nit"]
        cuis_codigo = data["cuis"]

        # Validar que el CUIS exista y pertenezca al NIT
        cuis = Cuis.objects.get(codigo=cuis_codigo)
        if cuis.usuario.nit != nit:
            raise Exception("CUIS no pertenece al NIT indicado")

        # Generar fecha de vigencia y código de control
        fecha_vigencia = timezone.now() + timedelta(hours=24)
        clave_control = get_random_string(16)

        # Crear el CUFD
        cufd = Cufd.objects.create(
            cuis=cuis,
            codigo_control=clave_control,
            fecha_vigencia=fecha_vigencia
        )

        return Response({
            "transaccion": True,
            "codigo": str(cufd.codigo),
            "codigoControl": clave_control,
            "fechaVigencia": fecha_vigencia.isoformat()
        })

    except Cuis.DoesNotExist:
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 101, "mensaje": "CUIS no válido"}]
        }, status=400)

    except Exception as e:
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 102, "mensaje": str(e)}]
        }, status=400)


@api_view(['POST'])
def recepcion_factura(request):
    # Token en el header
    token_header = request.headers.get("Authorization", "")
    if not token_header.startswith("Bearer "):
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 100, "mensaje": "Token no enviado correctamente"}]
        }, status=status.HTTP_401_UNAUTHORIZED)

    token_valor = token_header.replace("Bearer ", "").strip()
    try:
        token = Token.objects.get(valor=token_valor)
    except Token.DoesNotExist:
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 101, "mensaje": "Token inválido"}]
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Verificar que CUIS y CUFD pertenecen al usuario
    data = request.data
    cuis_codigo = data.get("cuis")
    cufd_codigo = data.get("cufd")
    
    try:
        cuis = Cuis.objects.get(codigo=cuis_codigo, usuario=token.usuario)
        cufd = Cufd.objects.get(codigo=cufd_codigo, cuis=cuis)
    except:
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 102, "mensaje": "CUIS o CUFD inválido"}]
        }, status=status.HTTP_400_BAD_REQUEST)

    # Crear factura simulada
    try:
        factura = Factura.objects.create(
            nit_emisor=data.get("nitEmisor"),
            nit_receptor=data.get("nitReceptor", "0"),
            fecha_emision=timezone.now(),
            monto_total=data.get("montoTotal", 0),
            codigo_establecimiento=data.get("codigoEstablecimiento", "0"),
            codigo_punto_venta=data.get("codigoPuntoVenta", "0"),
            forma_pago=data.get("formaPago", "1"),
            cuis=cuis,
            cufd=cufd
        )
        
        return Response({
            "transaccion": True,
            "cuf": str(factura.cuf),
            "codigoRecepcion": f"RECEP-{factura.cuf.hex[:10]}"
        })
    except Exception as e:
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 103, "mensaje": str(e)}]
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def verificacion_estado_factura(request):
    try:
        token_valor = request.GET.get('token')
        cuf = request.GET.get('cuf')
        
        print(f"🔍 Verificando CUF: {cuf} con token: {token_valor}")
        
        if not token_valor or not cuf:
            return Response({
                "transaccion": False,
                "estado": "Error - Faltan parámetros"
            })

        # Buscar token válido
        token = Token.objects.get(valor=token_valor)
        print(f"✅ Token válido para usuario: {token.usuario.nit}")
        
        # Buscar factura por CUF
        factura = Factura.objects.get(cuf=cuf)
        print(f"✅ Factura encontrada: Estado={factura.estado}")

        return Response({
            "transaccion": True,
            "estado": factura.estado,  # ✅ Devolver el estado real
            "fechaEmision": factura.fecha_emision.isoformat(),
            "cuis": str(factura.cuis.codigo),
            "nit_emisor": factura.nit_emisor
        })
        
    except Token.DoesNotExist:
        print("❌ Token no encontrado")
        return Response({
            "transaccion": False,
            "estado": "Token inválido"
        })
    except Factura.DoesNotExist:
        print(f"❌ Factura con CUF {cuf} no encontrada")
        return Response({
            "transaccion": False,
            "estado": "Factura no encontrada"
        })
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return Response({
            "transaccion": False,
            "estado": f"Error: {str(e)}"
        })


@api_view(['POST'])
def recepcion_factura_base64(request):
    try:
        # 1. Validar token
        token_header = request.headers.get("Authorization", "")
        if not token_header.startswith("Bearer "):
            return Response({
                "transaccion": False,
                "mensajesList": [{"codigo": 100, "mensaje": "Token no enviado correctamente"}]
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token_valor = token_header.replace("Bearer ", "").strip()
        try:
            token = Token.objects.get(valor=token_valor)
        except Token.DoesNotExist:
            return Response({
                "transaccion": False,
                "mensajesList": [{"codigo": 101, "mensaje": "Token inválido"}]
            }, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Extraer y validar datos del payload
        data = request.data
        try:
            nit = data.get("nit")
            cuis_codigo = data.get("cuis")
            cufd_codigo = data.get("cufd")
            archivo_base64 = data.get("archivo")
            
            if not all([nit, cuis_codigo, cufd_codigo, archivo_base64]):
                return Response({
                    "transaccion": False,
                    "mensajesList": [{"codigo": 102, "mensaje": "Faltan parámetros requeridos"}]
                }, status=status.HTTP_400_BAD_REQUEST)

            # 3. Validar CUIS y CUFD
            cuis = Cuis.objects.get(codigo=cuis_codigo, usuario=token.usuario)
            cufd = Cufd.objects.get(codigo=cufd_codigo, cuis=cuis)
            
            # 4. Procesar archivo base64
            try:
                # Decodificar base64
                archivo_bytes = base64.b64decode(archivo_base64)
                
                # Intentar descomprimir (si está comprimido)
                try:
                    archivo_descomprimido = gzip.decompress(archivo_bytes)
                    contenido_xml = archivo_descomprimido.decode('utf-8')
                except:
                    # Si no está comprimido, usar directamente
                    contenido_xml = archivo_bytes.decode('utf-8')
                
                # 5. Simular procesamiento del XML
                print("📄 Contenido XML recibido:", contenido_xml[:200] + "...")
                
                # 6. Crear factura simulada
                factura = Factura.objects.create(
                    nit_emisor=nit,
                    nit_receptor="0",  # Valor por defecto
                    fecha_emision=timezone.now(),
                    monto_total=100.00,  # Valor simulado
                    codigo_establecimiento="0",
                    codigo_punto_venta="0",
                    forma_pago="1",
                    cuis=cuis,
                    cufd=cufd
                )
                
                return Response({
                    "transaccion": True,
                    "cuf": str(factura.cuf),
                    "codigoRecepcion": f"RECEP-{factura.cuf.hex[:10]}",
                    "mensajeRecepcion": "Factura procesada correctamente"
                })
                
            except Exception as decode_error:
                print("❌ Error decodificando archivo:", str(decode_error))
                return Response({
                    "transaccion": False,
                    "mensajesList": [{"codigo": 103, "mensaje": f"Error procesando archivo: {str(decode_error)}"}]
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (Cuis.DoesNotExist, Cufd.DoesNotExist):
            return Response({
                "transaccion": False,
                "mensajesList": [{"codigo": 104, "mensaje": "CUIS o CUFD inválido"}]
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print("❌ Error general en recepcion_factura_base64:", str(e))
        traceback.print_exc()
        return Response({
            "transaccion": False,
            "mensajesList": [{"codigo": 105, "mensaje": str(e)}]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ AGREGAR ESTAS NUEVAS VIEWS AL FINAL DEL ARCHIVO

@method_decorator(csrf_exempt, name='dispatch')
class UsuarioSIATAPIView(APIView):
    """CRUD para gestionar usuarios SIAT de prueba"""
    
    def get(self, request, nit=None):
        """Listar usuarios o obtener uno específico"""
        try:
            if nit:
                usuario = Usuario.objects.get(nit=nit)
                return Response({
                    'nit': usuario.nit,
                    'clave': usuario.clave,
                    'codigo_ambiente': usuario.codigo_ambiente,
                    'creado': 'Sí'
                })
            else:
                usuarios = Usuario.objects.all()
                return Response({
                    'usuarios': [
                        {
                            'nit': u.nit,
                            'clave': u.clave,
                            'codigo_ambiente': u.codigo_ambiente
                        } for u in usuarios
                    ],
                    'total': usuarios.count()
                })
        except Usuario.DoesNotExist:
            return Response({
                'error': f'Usuario con NIT {nit} no encontrado'
            }, status=404)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)
    
    def post(self, request):
        """Crear nuevo usuario SIAT"""
        try:
            data = request.data
            nit = data.get('nit')
            clave = data.get('clave')
            codigo_ambiente = data.get('codigo_ambiente', '2')
            
            if not nit or not clave:
                return Response({
                    'error': 'NIT y clave son requeridos'
                }, status=400)
            
            # Verificar si ya existe
            if Usuario.objects.filter(nit=nit).exists():
                return Response({
                    'error': f'Usuario con NIT {nit} ya existe'
                }, status=400)
            
            usuario = Usuario.objects.create(
                nit=nit,
                clave=clave,
                codigo_ambiente=codigo_ambiente
            )
            
            return Response({
                'mensaje': f'Usuario SIAT creado exitosamente',
                'nit': usuario.nit,
                'clave': usuario.clave,
                'codigo_ambiente': usuario.codigo_ambiente
            }, status=201)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)
    
    def put(self, request, nit):
        """Actualizar usuario SIAT"""
        try:
            usuario = Usuario.objects.get(nit=nit)
            
            data = request.data
            if 'clave' in data:
                usuario.clave = data['clave']
            if 'codigo_ambiente' in data:
                usuario.codigo_ambiente = data['codigo_ambiente']
                
            usuario.save()
            
            return Response({
                'mensaje': f'Usuario SIAT actualizado exitosamente',
                'nit': usuario.nit,
                'clave': usuario.clave,
                'codigo_ambiente': usuario.codigo_ambiente
            })
            
        except Usuario.DoesNotExist:
            return Response({
                'error': f'Usuario con NIT {nit} no encontrado'
            }, status=404)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)
    
    def delete(self, request, nit):
        """Eliminar usuario SIAT"""
        try:
            usuario = Usuario.objects.get(nit=nit)
            usuario.delete()
            
            return Response({
                'mensaje': f'Usuario SIAT con NIT {nit} eliminado exitosamente'
            })
            
        except Usuario.DoesNotExist:
            return Response({
                'error': f'Usuario con NIT {nit} no encontrado'
            }, status=404)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)

# ✅ VISTA PARA LIMPIAR DATOS DE PRUEBA
@api_view(['DELETE'])
def limpiar_datos_prueba(request):
    """Eliminar todos los tokens, CUIS, CUFD y facturas para testing"""
    try:
        Token.objects.all().delete()
        Cufd.objects.all().delete()
        Cuis.objects.all().delete()
        Factura.objects.all().delete()
        
        return Response({
            'mensaje': 'Datos de prueba eliminados exitosamente',
            'eliminados': 'Tokens, CUIS, CUFD y Facturas'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
def validar_nit_contribuyente(request):
    """
    Simula la validación de NIT en el sistema del SIN
    """
    nit = request.GET.get('nit')
    
    if not nit:
        return Response({
            'transaccion': False,
            'error': 'Parámetro NIT requerido'
        })
    
    # NITs especiales que siempre son válidos
    nits_especiales = {
        '0': 'Consumidor Final',
        '99001': 'Extranjero sin NIT',
        '99002': 'Extranjero con NIT del país de origen', 
        '99003': 'Venta a crédito fiscal'
    }
    
    if nit in nits_especiales:
        return Response({
            'transaccion': True,
            'contribuyente': {
                'nit': nit,
                'razonSocial': nits_especiales[nit],
                'estado': 'ACTIVO',
                'tipo': 'ESPECIAL'
            },
            'mensaje': 'NIT especial válido'
        })
    
    # Validar formato básico de NIT boliviano
    if not re.match(r'^\d{7,12}$', nit):
        return Response({
            'transaccion': False,
            'error': 'Formato de NIT inválido. Debe contener entre 7 y 12 dígitos'
        })
    
    # Buscar en la "base de datos del SIN" (simulada)
    try:
        cliente = Cliente.objects.get(nit=nit)
        return Response({
            'transaccion': True,
            'contribuyente': {
                'nit': cliente.nit,
                'razonSocial': cliente.nombre,
                'estado': cliente.estado,
                'tipo': cliente.tipo_contribuyente
            },
            'mensaje': 'Contribuyente encontrado'
        })
    except Cliente.DoesNotExist:
        return Response({
            'transaccion': False,
            'error': f'El NIT {nit} no se encuentra registrado en el padrón de contribuyentes'
        })

@api_view(['POST'])
def facturar_con_validacion_nit(request):
    """
    Procesa una factura validando primero el NIT del receptor
    """
    try:
        # Extraer datos de la solicitud
        nit_receptor = request.data.get('nitReceptor', '0')
        nombre_receptor = request.data.get('nombreReceptor', 'SIN NOMBRE')
        
        # Validar NIT del receptor
        if nit_receptor not in ['0', '99001', '99002', '99003']:
            try:
                cliente = Cliente.objects.get(nit=nit_receptor)
                if cliente.estado != 'ACTIVO':
                    return Response({
                        'transaccion': False,
                        'error': f'El contribuyente con NIT {nit_receptor} no está activo'
                    })
                # Usar el nombre registrado en el SIN
                nombre_receptor = cliente.nombre
            except Cliente.DoesNotExist:
                return Response({
                    'transaccion': False,
                    'error': f'El NIT {nit_receptor} no está registrado en el padrón de contribuyentes'
                })
        
        # Si llegamos aquí, el NIT es válido, proceder con la facturación normal
        # ... resto de la lógica de facturación ...
        
        # Simular respuesta exitosa
        import uuid
        cuf = str(uuid.uuid4())
        
        return Response({
            'transaccion': True,
            'cuf': cuf,
            'codigoRecepcion': f'REC-{cuf[:8]}',
            'estado': 'Aceptado',
            'mensaje': 'Factura procesada exitosamente',
            'receptor': {
                'nit': nit_receptor,
                'nombre': nombre_receptor
            }
        })
        
    except Exception as e:
        return Response({
            'transaccion': False,
            'error': f'Error procesando factura: {str(e)}'
        })