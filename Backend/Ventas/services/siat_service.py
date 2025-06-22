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
                return False
                
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
                    return True
                else:
                    print(f"❌ Error en respuesta para {self.razon_social}: {result.get('mensajesList')}")
                    return False
            else:
                print(f"❌ Error HTTP para {self.razon_social}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Excepción obteniendo token para {self.razon_social}: {str(e)}")
            return False
    
    def obtener_cuis(self):
        """Obtiene el CUIS"""
        if not self.token:
            if not self.obtener_token():
                return False
                
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
                    return True
                else:
                    print(f"❌ Error obteniendo CUIS para {self.razon_social}: {result.get('mensajesList')}")
                    return False
            else:
                print(f"❌ Error HTTP CUIS para {self.razon_social}: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Excepción CUIS para {self.razon_social}: {str(e)}")
            return False
    
    def obtener_cufd(self):
        """Obtiene el CUFD"""
        if not self.cuis:
            if not self.obtener_cuis():
                return False
                
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
                    return True
                else:
                    print(f"❌ Error obteniendo CUFD para {self.razon_social}: {result.get('mensajesList')}")
                    return False
            else:
                print(f"❌ Error HTTP CUFD para {self.razon_social}: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Excepción CUFD para {self.razon_social}: {str(e)}")
            return False
    
    def generar_xml_factura(self, pedido):
        """Genera el XML de la factura"""
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
        <nitReceptor>0</nitReceptor>
        <razonSocialReceptor>SIN NOMBRE</razonSocialReceptor>
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
    
    def enviar_factura(self, pedido):
        """Envía la factura al SIAT"""
        try:
            print(f"🧾 Iniciando facturación para {self.razon_social} - Pedido {pedido.id}")
            
            if not self.cufd:
                if not self.obtener_cufd():
                    return {'success': False, 'error': 'No se pudo obtener CUFD'}
            
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
            return {'success': False, 'error': str(e)}
    
    def verificar_estado_factura(self, cuf):
        """Verifica el estado de una factura en SIAT"""
        try:
            print(f"🔍 Verificando estado de factura para {self.razon_social}: {cuf}")
            
            # ✅ ASEGURAR QUE TENEMOS TOKEN
            if not self.token:
                print("🔑 Token no disponible, obteniendo nuevo token...")
                if not self.obtener_token():
                    return {
                        'transaccion': False,
                        'error': 'No se pudo obtener token para verificación'
                    }
            
            url = f"{self.base_url}/api/facturacion/verificacion/"
            
            # ✅ AGREGAR PARÁMETROS EN LA URL
            params = {
                'token': self.token,
                'cuf': cuf
            }
            
            print(f"🔗 Enviando verificación con token: {self.token[:20]}...")
            print(f"🔗 Parámetros: {params}")
            
            # ✅ USAR GET CON PARÁMETROS
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