import requests
import base64
import gzip
import json
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class SIATService:
    def __init__(self, usuario):
        """
        Inicializar servicio SIAT con datos específicos del usuario/empresa
        
        Args:
            usuario: Instancia del modelo Usuario con datos SIAT configurados
        """
        self.base_url = 'http://127.0.0.1:8001'  # Tu API SIAT
        self.usuario = usuario
        
        # Datos específicos de cada empresa
        self.nit = usuario.nit_empresa
        self.clave_siat = usuario.clave_siat
        self.codigo_sistema = usuario.codigo_sistema
        self.codigo_ambiente = usuario.codigo_ambiente or '2'
        self.razon_social = usuario.razon_social or usuario.nombre_empresa
        self.municipio = usuario.municipio or 'La Paz'
        self.telefono = usuario.telefono_empresa or '00000000'
        
        # Por ahora, valores por defecto para establecimiento y punto de venta
        # TODO: Implementar sucursales en el futuro
        self.codigo_establecimiento = '0'
        self.codigo_punto_venta = '0'
        
        self.timeout = 30
        self.token = None
        self.cuis = None
        self.cufd = None
        
    def validar_configuracion(self):
        """Valida que el usuario tenga la configuración SIAT necesaria"""
        errores = []
        
        if not self.nit:
            errores.append("NIT no configurado")
        if not self.clave_siat:
            errores.append("Clave SIAT no configurada")
        if not self.codigo_sistema:
            errores.append("Código de sistema no configurado")
        if not self.razon_social:
            errores.append("Razón social no configurada")
            
        return errores
        
    def obtener_token(self):
        """Obtiene el token de autenticación del SIAT"""
        try:
            # Validar configuración antes de proceder
            errores = self.validar_configuracion()
            if errores:
                print(f"❌ Errores de configuración para {self.razon_social}: {', '.join(errores)}")
                return {
                    'transaccion': False,
                    'error': f'Configuración incompleta: {", ".join(errores)}'
                }
                
            url = f"{self.base_url}/api/auth/token/"
            data = {
                "username": self.nit,
                "password": self.clave_siat,
                "codigoSistema": self.codigo_sistema
            }
            
            print(f"🔗 Solicitando token para empresa: {self.razon_social} (NIT: {self.nit})")
            
            response = requests.post(url, json=data, timeout=self.timeout)
            
            print(f"📥 Respuesta del SIAT: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('transaccion'):
                    self.token = result.get('token')
                    print(f"✅ Token obtenido para {self.razon_social}")
                    return {
                        'transaccion': True,
                        'token': self.token
                    }
                else:
                    print(f"❌ Error en respuesta para {self.razon_social}: {result.get('mensajesList')}")
                    return {
                        'transaccion': False,
                        'error': result.get('mensajesList', 'Error obteniendo token')
                    }
            else:
                print(f"❌ Error HTTP para {self.razon_social}: {response.status_code} - {response.text}")
                return {
                    'transaccion': False,
                    'error': f'Error HTTP: {response.status_code}'
                }
                
        except Exception as e:
            print(f"❌ Excepción obteniendo token para {self.razon_social}: {str(e)}")
            return {
                'transaccion': False,
                'error': f'Error de conexión: {str(e)}'
            }
    
    def obtener_cuis(self):
        """Obtiene el CUIS"""
        if not self.token:
            token_result = self.obtener_token()
            if not token_result.get('transaccion'):
                return token_result
                
        try:
            url = f"{self.base_url}/api/codigos/cuis/"
            headers = {"Authorization": f"Bearer {self.token}"}
            data = {
                "nit": self.nit,
                "codigoAmbiente": self.codigo_ambiente,
                "codigoSistema": self.codigo_sistema
            }
            
            print(f"🔗 Solicitando CUIS para {self.razon_social}")
            
            response = requests.post(url, json=data, headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('transaccion'):
                    self.cuis = result.get('codigo')
                    print(f"✅ CUIS obtenido para {self.razon_social}: {self.cuis}")
                    return {
                        'transaccion': True,
                        'codigo': self.cuis
                    }
                else:
                    print(f"❌ Error obteniendo CUIS para {self.razon_social}: {result.get('mensajesList')}")
                    return {
                        'transaccion': False,
                        'error': result.get('mensajesList', 'Error obteniendo CUIS')
                    }
            else:
                print(f"❌ Error HTTP CUIS para {self.razon_social}: {response.status_code}")
                return {
                    'transaccion': False,
                    'error': f'Error HTTP: {response.status_code}'
                }
                
        except Exception as e:
            print(f"❌ Excepción CUIS para {self.razon_social}: {str(e)}")
            return {
                'transaccion': False,
                'error': f'Error de conexión: {str(e)}'
            }
    
    def obtener_cufd(self):
        """Obtiene el CUFD"""
        if not self.cuis:
            cuis_result = self.obtener_cuis()
            if not cuis_result.get('transaccion'):
                return cuis_result
                
        try:
            url = f"{self.base_url}/api/codigos/cufd/"
            data = {
                "nit": self.nit,
                "cuis": self.cuis,
                "codigoAmbiente": self.codigo_ambiente
            }
            
            print(f"🔗 Solicitando CUFD para {self.razon_social}")
            
            response = requests.post(url, json=data, timeout=self.timeout)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('transaccion'):
                    self.cufd = result.get('codigo')
                    print(f"✅ CUFD obtenido para {self.razon_social}: {self.cufd}")
                    return {
                        'transaccion': True,
                        'codigo': self.cufd
                    }
                else:
                    print(f"❌ Error obteniendo CUFD para {self.razon_social}: {result.get('mensajesList')}")
                    return {
                        'transaccion': False,
                        'error': result.get('mensajesList', 'Error obteniendo CUFD')
                    }
            else:
                print(f"❌ Error HTTP CUFD para {self.razon_social}: {response.status_code}")
                return {
                    'transaccion': False,
                    'error': f'Error HTTP: {response.status_code}'
                }
                
        except Exception as e:
            print(f"❌ Excepción CUFD para {self.razon_social}: {str(e)}")
            return {
                'transaccion': False,
                'error': f'Error de conexión: {str(e)}'
            }
    
    def generar_xml_factura(self, pedido):
        """Genera el XML de la factura"""
        # Obtener datos del cliente del pedido
        nit_cliente = getattr(pedido, 'cliente_nit', '0')
        nombre_cliente = getattr(pedido, 'cliente_nombre', 'SIN NOMBRE')
        
        total_sin_impuestos = sum(
            detalle.cantidad * detalle.producto.precio_venta 
            for detalle in pedido.detalles.all()
        )
        
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<facturaElectronicaCompraVenta>
    <cabecera>
        <nitEmisor>{self.nit}</nitEmisor>
        <razonSocialEmisor>{self.razon_social}</razonSocialEmisor>
        <municipio>{self.municipio}</municipio>
        <telefono>{self.telefono}</telefono>
        <nitReceptor>{nit_cliente}</nitReceptor>
        <razonSocialReceptor>{nombre_cliente}</razonSocialReceptor>
        <codigoMetodoPago>1</codigoMetodoPago>
        <numeroTarjeta>0</numeroTarjeta>
        <montoTotal>{pedido.total}</montoTotal>
        <montoTotalSujetoIva>{total_sin_impuestos}</montoTotalSujetoIva>
        <codigoMoneda>1</codigoMoneda>
        <tipoCambio>1</tipoCambio>
        <montoTotalMoneda>{pedido.total}</montoTotalMoneda>
        <leyenda>Ley N° 453: Tienes derecho a recibir información sobre las características y contenidos de los servicios que utilices.</leyenda>
        <usuario>{self.nit}</usuario>
        <codigoDocumentoSector>1</codigoDocumentoSector>
    </cabecera>
    <detalle>"""
        
        for i, detalle in enumerate(pedido.detalles.all(), 1):
            subtotal = detalle.cantidad * detalle.producto.precio_venta
            xml_content += f"""
        <item>
            <numeroItem>{i}</numeroItem>
            <codigoProducto>{detalle.producto.id}</codigoProducto>
            <descripcion>{detalle.producto.nombre}</descripcion>
            <cantidad>{detalle.cantidad}</cantidad>
            <unidadMedida>1</unidadMedida>
            <precioUnitario>{detalle.producto.precio_venta}</precioUnitario>
            <montoDescuento>0</montoDescuento>
            <subTotal>{subtotal}</subTotal>
        </item>"""
        
        xml_content += """
    </detalle>
</facturaElectronicaCompraVenta>"""
        
        return xml_content
    
    def validar_nit_contribuyente(self, nit):
        """Valida un NIT contra el padrón del SIN y devuelve datos del contribuyente"""
        try:
            url = f"{self.base_url}/api/validar-nit/"
            params = {'nit': nit}
            
            print(f"🔍 Validando NIT {nit} en {url}")
            response = requests.get(url, params=params, timeout=self.timeout)
            
            print(f"📥 Status Code: {response.status_code}")
            print(f"📥 Respuesta completa: {response.text}")
            
            if response.status_code == 200:
                resultado = response.json()
                print(f"📋 Resultado parseado: {resultado}")
                
                # ✅ AJUSTAR SEGÚN LA ESTRUCTURA REAL DE TU API
                if resultado.get('transaccion', False):
                    # Extraer datos del contribuyente según tu estructura
                    contribuyente = resultado.get('contribuyente', {})
                    
                    datos_contribuyente = {
                        'nit': nit,
                        'razonSocial': contribuyente.get('razonSocial') or contribuyente.get('nombre', 'CONTRIBUYENTE VÁLIDO'),
                        'estado': contribuyente.get('estado', 'ACTIVO'),
                        'tipo': contribuyente.get('tipo', 'PERSONA NATURAL')
                    }
                    
                    print(f"✅ Datos extraídos: {datos_contribuyente}")
                    
                    return {
                        'transaccion': True,
                        'mensaje': 'NIT válido',
                        'datos': datos_contribuyente
                    }
                else:
                    error_msg = resultado.get('error') or resultado.get('mensaje', 'NIT no encontrado')
                    print(f"❌ NIT no válido: {error_msg}")
                    return {
                        'transaccion': False,
                        'error': error_msg
                    }
            else:
                print(f"❌ Error HTTP validando NIT: {response.status_code}")
                return {
                    'transaccion': False,
                    'error': f'Error HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            print(f"❌ Error validando NIT: {str(e)}")
            return {
                'transaccion': False,
                'error': f'Error de conexión: {str(e)}'
            }

    def enviar_factura(self, pedido):
        """Envía la factura al SIAT con validación de NIT"""
        try:
            print(f"🎯 Procesando factura para pedido {pedido.id}")
            
            # 1. Validar configuración
            errores = self.validar_configuracion()
            if errores:
                return {
                    'success': False,
                    'error': f'Configuración SIAT incompleta: {", ".join(errores)}'
                }
            
            # 2. Obtener token si no existe
            if not self.token:
                token_result = self.obtener_token()
                if not token_result.get('transaccion', False):
                    return {
                        'success': False,
                        'error': token_result.get('error', 'Error obteniendo token')
                    }
            
            # 3. Validar NIT del cliente (si no es especial)
            nit_cliente = getattr(pedido, 'cliente_nit', '0')
            if nit_cliente and nit_cliente not in ['0', '99001', '99002', '99003']:
                print(f"🔍 Validando NIT del cliente: {nit_cliente}")
                validacion_result = self.validar_nit_contribuyente(nit_cliente)
                
                if isinstance(validacion_result, dict) and not validacion_result.get('transaccion', False):
                    return {
                        'success': False,
                        'error': f"NIT del cliente inválido: {validacion_result.get('error', 'Error desconocido')}"
                    }
                print(f"✅ NIT del cliente validado correctamente")
            
            # 4. Obtener CUFD (que internamente obtiene CUIS si es necesario)
            cufd_result = self.obtener_cufd()
            if not cufd_result.get('transaccion', False):
                return {
                    'success': False,
                    'error': cufd_result.get('error', 'Error obteniendo CUFD')
                }
            
            # 5. Generar XML y enviar
            xml_content = self.generar_xml_factura(pedido)
            xml_bytes = xml_content.encode('utf-8')
            compressed_xml = gzip.compress(xml_bytes)
            archivo_base64 = base64.b64encode(compressed_xml).decode('utf-8')
            
            url = f"{self.base_url}/api/facturacion/recepcion-base64/"
            headers = {"Authorization": f"Bearer {self.token}"}
            data = {
                "nit": self.nit,
                "cuis": self.cuis,
                "cufd": self.cufd,
                "archivo": archivo_base64
            }
            
            print(f"📤 Enviando factura al SIAT para {self.razon_social}")
            
            response = requests.post(url, json=data, headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('transaccion'):
                    print(f"✅ Factura enviada exitosamente para {self.razon_social}")
                    return {
                        'success': True,
                        'cuf': result.get('cuf'),
                        'codigo_recepcion': result.get('codigoRecepcion'),
                        'mensaje': result.get('mensajeRecepcion', 'Factura enviada correctamente')
                    }
                else:
                    print(f"❌ Error en facturación para {self.razon_social}: {result.get('mensajesList')}")
                    return {
                        'success': False,
                        'error': result.get('mensajesList', 'Error desconocido')
                    }
            else:
                print(f"❌ Error HTTP facturación para {self.razon_social}: {response.status_code}")
                return {
                    'success': False,
                    'error': f'Error HTTP: {response.status_code} - {response.text}'
                }
                
        except Exception as e:
            print(f"❌ Error enviando factura para {self.razon_social}: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}'
            }
    
    def verificar_estado_factura(self, cuf):
        """Verifica el estado de una factura en SIAT"""
        try:
            print(f"🔍 Verificando estado de factura para {self.razon_social}: {cuf}")
            
            # Asegurar que tenemos token
            if not self.token:
                print("🔑 Token no disponible, obteniendo nuevo token...")
                token_result = self.obtener_token()
                if not token_result.get('transaccion', False):
                    return {
                        'transaccion': False,
                        'error': 'No se pudo obtener token para verificación'
                    }
            
            url = f"{self.base_url}/api/facturacion/verificacion/"
            
            # Agregar parámetros en la URL
            params = {
                'token': self.token,
                'cuf': cuf
            }
            
            print(f"🔗 Enviando verificación con token: {self.token[:20]}...")
            print(f"🔗 Parámetros: {params}")
            
            # Usar GET con parámetros
            response = requests.get(url, params=params, timeout=30)
            
            print(f"📊 Status code verificación: {response.status_code}")
            print(f"📥 Respuesta verificación: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                return data
            else:
                return {
                    'transaccion': False,
                    'error': f'Error HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            print(f"❌ Error verificando estado: {str(e)}")
            return {
                'transaccion': False,
                'error': f'Error de conexión: {str(e)}'
            }
    
    def anular_factura(self, cuf, motivo):
        """Anula una factura en el SIAT"""
        try:
            # ✅ CORREGIR LA URL - usar /api/anular/ en lugar de /api/facturacion/anular/
            url = f"{self.base_url}/api/anular/"
            
            payload = {
                'cuf': cuf,
                'motivo': motivo,
                'empresa': {
                    'nit': self.usuario.nit_empresa,
                    'razon_social': self.usuario.razon_social or self.usuario.nombre_empresa
                }
            }
            
            print(f"🗑️ Anulando factura CUF: {cuf}")
            print(f"📤 URL: {url}")
            print(f"📤 Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=self.timeout)
            print(f"📥 Respuesta SIAT anulación: {response.status_code}")
            print(f"📄 Contenido: {response.text}")
            
            if response.status_code == 200:
                resultado = response.json()
                
                if resultado.get('transaccion', False):
                    return {
                        'success': True,
                        'mensaje': resultado.get('mensaje', 'Factura anulada exitosamente'),
                        'detalles': resultado.get('detalles', {})
                    }
                else:
                    return {
                        'success': False,
                        'error': resultado.get('error', 'Error al anular factura')
                    }
            else:
                return {
                    'success': False,
                    'error': f'Error HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            print(f"❌ Error anulando factura: {str(e)}")
            return {
                'success': False,
                'error': f'Error de conexión: {str(e)}'
            }