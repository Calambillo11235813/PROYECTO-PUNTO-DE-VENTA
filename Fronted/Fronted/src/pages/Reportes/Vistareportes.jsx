import React, { useState, useEffect } from 'react';
import { FaChartBar, FaFileDownload, FaFilePdf, FaFilter, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import reporteService from '../../services/reporteService';
import apiClient from '../../services/apiClient';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

const Vistareportes = () => {
  const [reportType, setReportType] = useState('ventas');
  const [reportSubType, setReportSubType] = useState('general');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState(null);

  // Agregar estos estados que faltan:
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');

  // Opciones de subtipos según el tipo de reporte (revertidas)
  const subTypeOptions = {
    ventas: [
      { value: 'general', label: 'General' },
      { value: 'productos', label: 'Por Productos' }
    ],
    productos: [
      { value: 'inventario', label: 'Inventario General' },
      { value: 'categorias', label: 'Por Categorías' }  // Asegurar que esté presente
    ],
    clientes: [
      { value: 'general', label: 'Listado General' }
    ],
    caja: [
      { value: 'resumen', label: 'Resumen' },
    ],
    movimientos: [
      { value: 'general', label: 'Todos los Movimientos' }
    ]
  };

  // Limpiar categoría seleccionada cuando se cambia el tipo de reporte
  useEffect(() => {
    if (subTypeOptions[reportType] && subTypeOptions[reportType].length > 0) {
      setReportSubType(subTypeOptions[reportType][0].value);
    }
    setReportData(null);
  }, [reportType]);

  // Función para generar el reporte
  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Generando reporte:', { 
        tipo: reportType, 
        subtipo: reportSubType, 
        fechas: dateRange
      });

      const filtros = {
        fecha_inicio: dateRange.startDate,
        fecha_fin: dateRange.endDate,
      };

      // Agregar filtro de categoría para productos
      if (reportType === 'productos' && selectedCategoria) {
        filtros.categoria = selectedCategoria;
      }

      let data;
      
      switch (reportType) {
        case 'productos':
          data = await reporteService.getReporteProductos({
            tipo: reportSubType,
            filtros: filtros
          });
          break;
          
        case 'ventas':
          data = await reporteService.getReporteVentas({
            tipo: reportSubType,
            filtros: filtros
          });
          break;
          
        case 'clientes':
          data = await reporteService.getReporteClientes({
            tipo: reportSubType,
            filtros: filtros
          });
          break;
          
        case 'caja':
          data = await reporteService.getReporteCaja({
            tipo: reportSubType,
            filtros: filtros
          });
          break;
          
        case 'movimientos':
          data = await reporteService.getReporteMovimientos(filtros);
          break;
          
        default:
          throw new Error(`Tipo de reporte no válido: ${reportType}`);
      }
      
      const datosAdaptados = adaptarDatos(data, reportType);
      console.log(`✅ Datos adaptados para ${reportType}:`, datosAdaptados);
      
      setReportData(datosAdaptados);
    } catch (err) {
      console.error('❌ Error generando reporte:', err);
      
      let errorMessage = 'Error al generar el reporte';
      
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para adaptar los datos del backend a la estructura esperada
  const adaptarDatos = (data, tipoReporte) => {
    console.log(`Adaptando datos para ${tipoReporte}:`, data);
    
    switch (tipoReporte) {
      case 'ventas':
        return {
          ...data,
          ventas: data.ventas || [],
          resumen: data.resumen || {}
        };
        
      case 'productos':
        return {
          ...data,
          productos: data.productos || [],
          categorias: data.categorias || [],
          total_productos: data.total_productos || 0,
          categoria_info: data.categoria_info || null
        };
        
      case 'clientes':
        return {
          ...data,
          clientes: data.clientes || [],
          resumen: data.resumen || {}
        };
        
      case 'caja':
        return {
          ...data,
          cajas: data.cajas || [],
          total_general: data.total_general || {}
        };
        
      case 'movimientos':
        return {
          ...data,
          cajas: data.cajas || [],
          resumen: data.resumen || {}
        };
        
      default:
        return data;
    }
  };

  // Reemplazar la función exportarReporte existente con esta versión
  const exportarReporte = async (formato) => {
    if (!reportData) {
      alert('Genera un reporte primero');
      return;
    }

    try {
      setLoading(true);

      if (formato === 'pdf') {
        // Obtener el elemento que contiene el reporte
        const element = document.getElementById('reporte-container');
        
        if (!element) {
          alert('Error: No se encontró el contenido del reporte');
          setLoading(false);
          return;
        }

        // Crear un contenedor temporal para el PDF con estilos específicos
        const pdfContainer = document.createElement('div');
        pdfContainer.style.width = '100%';
        pdfContainer.style.padding = '0';
        pdfContainer.style.boxSizing = 'border-box';
        pdfContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Obtener la fecha actual formateada
        const fechaActual = new Date().toLocaleDateString();
        
        // Crear la cabecera para el PDF
        const headerHTML = `
          <div style="text-align: center; margin-bottom: 30px; padding: 10px;">
            <h1 style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
              Reporte de ${reportType === 'productos' ? 'Productos' : reportType}
              ${reportSubType ? ` - ${subTypeOptions[reportType].find(opt => opt.value === reportSubType)?.label || reportSubType}` : ''}
            </h1>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">Fecha de generación: ${fechaActual}</p>
          </div>
        `;
        
        // Estilos específicos para tablas y otros elementos en el PDF
        const pdfStyles = `
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.3;
              color: #333;
              margin: 0;
              padding: 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 9px;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 4px;
              text-align: left;
              font-size: 9px;
            }
            
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            
            .pdf-grid {
              width: 100%;
              display: table;
              border-collapse: separate;
              border-spacing: 8px;
              margin-bottom: 20px;
              table-layout: fixed;
            }
            
            .pdf-grid-row {
              display: table-row;
            }
            
            .pdf-grid-cell {
              display: table-cell;
              background-color: #f9f9f9;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 8px;
              vertical-align: top;
            }
            
            .pdf-card {
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 8px;
              margin-bottom: 8px;
            }
            
            .pdf-card-header {
              color: #6b7280;
              font-size: 9px;
              margin-bottom: 4px;
            }
            
            .pdf-card-value {
              font-size: 16px;
              font-weight: bold;
            }
            
            .pdf-section {
              margin-bottom: 20px;
            }
            
            .pdf-section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .text-green {
              color: #059669;
            }
            
            .text-red {
              color: #dc2626;
            }
            
            .bg-gray {
              background-color: #f9f9f9;
            }
            
            @page {
              size: landscape;
              margin: 15mm 10mm 10mm 10mm;
            }
          </style>
        `;
        
        // Clonar el contenido HTML y aplicar modificaciones específicas para PDF
        let contentHTML = element.innerHTML;
        
        // Reemplazar clases específicas de Tailwind con estilos inline ajustados para PDF
        contentHTML = contentHTML
          // Reemplazar grids para evitar sobreposición
          .replace(/<div class="grid[^>]*>/g, '<div class="pdf-grid">')
          .replace(/<div class="bg-white p-3 rounded-md border[^>]*>/g, 
                   '<div class="pdf-grid-cell">')
          .replace(/<div class="bg-gray-50 p-2 rounded[^>]*>/g, 
                   '<div class="pdf-grid-cell">')
          // Reemplazar colores
          .replace(/class="text-green-600([^"]*)"/g, 'class="text-green"')
          .replace(/class="text-red-600([^"]*)"/g, 'class="text-red"')
          .replace(/class="bg-gray-50([^"]*)"/g, 'class="bg-gray"')
          // Reemplazar texto
          .replace(/class="font-medium([^"]*)"/g, 'style="font-weight: 500;"')
          .replace(/class="font-bold([^"]*)"/g, 'style="font-weight: bold;"')
          // Mejorar dimensiones
          .replace(/class="p-4 mb-4([^"]*)"/g, 'style="padding: 10px; margin-bottom: 20px;"');
      
        // Insertar estilos y cabecera en el contenedor temporal
        pdfContainer.innerHTML = pdfStyles + headerHTML + contentHTML;
        
        // Aplicar cambios específicos según el tipo de reporte para evitar sobreposiciones
        if (reportType === 'productos' || reportType === 'caja' || reportType === 'movimientos') {
          // Convertir cualquier grid responsiva en estructura de tabla para PDF
          const grids = pdfContainer.querySelectorAll('.grid');
          grids.forEach(grid => {
            // Reemplazar con estructura de tabla
            const originalContent = grid.innerHTML;
            const newTable = document.createElement('table');
            newTable.className = 'pdf-grid';
            newTable.style.borderCollapse = 'separate';
            newTable.style.borderSpacing = '8px';
            newTable.style.width = '100%';
            newTable.style.marginBottom = '15px';
            
            // Crear una fila para los elementos
            const tr = document.createElement('tr');
            
            // Extraer cada tarjeta y ponerla en una celda
            const cards = grid.querySelectorAll('.bg-white, .bg-gray-50');
            cards.forEach(card => {
              const td = document.createElement('td');
              td.style.backgroundColor = '#f9f9f9';
              td.style.border = '1px solid #e5e7eb';
              td.style.borderRadius = '4px';
              td.style.padding = '8px';
              td.style.width = `${100 / cards.length}%`;
              td.innerHTML = card.innerHTML;
              tr.appendChild(td);
            });
            
            newTable.appendChild(tr);
            grid.replaceWith(newTable);
          });
        }
        
        // Configuración para la exportación PDF
        const opt = {
          margin: [25, 10, 15, 10], // [top, right, bottom, left]
          filename: `Reporte_${reportType}_${reportSubType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 1.5,
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1200,
            logging: false
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape',
            compress: true,
            precision: 16
          },
          pagebreak: { avoid: ['tr', 'td'] }
        };
        
        // Ajustar configuración específica según el tipo de reporte
        if (reportType === 'productos') {
          if (reportSubType === 'inventario') {
            opt.jsPDF.orientation = 'landscape';
          } else if (reportSubType === 'categorias') {
            opt.pagebreak.before = '.categoria-section';
          }
        } else if (reportType === 'caja' || reportType === 'movimientos') {
          opt.jsPDF.orientation = 'landscape';
          opt.html2canvas.scale = 1.3;
        }
        
        console.log('Generando PDF con html2pdf...');
        
        // Crear un worker para generar el PDF
        const worker = html2pdf().from(pdfContainer).set(opt);
        
        // Agregar números de página
        await worker
          .toPdf()
          .get('pdf')
          .then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            
            // Agregar números de página a cada página
            for (let i = 1; i <= totalPages; i++) {
              pdf.setPage(i);
              pdf.setFontSize(8);
              pdf.setTextColor(100);
              
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              
              pdf.text(
                `Página ${i} de ${totalPages}`,
                pageWidth / 2, 
                pageHeight - 5,
                { align: 'center' }
              );
            }
          })
          .save();
        
        console.log('PDF generado correctamente');
      } else if (formato === 'excel') {
        // Preparar los datos para Excel según el tipo de reporte
        let dataForExcel = [];
        let sheetName = '';
        let fileName = `Reporte_${reportType}_${reportSubType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
        
        // Crear un nuevo libro de Excel aquí, ANTES de cualquier uso de wb
        const wb = XLSX.utils.book_new();
        
        switch (reportType) {
          case 'productos':
            if (reportSubType === 'inventario') {
              // Preparar datos para reporte de inventario
              sheetName = 'Inventario';
              
              // Encabezados
              dataForExcel.push([
                'ID', 'Producto', 'Categoría', 'Precio', 'Stock Actual', 'Stock Mínimo'
              ]);
              
              // Datos
              reportData.productos.forEach(producto => {
                dataForExcel.push([
                  producto.id,
                  producto.nombre,
                  producto.categoria?.nombre || 'Sin categoría',
                  parseFloat(producto.precio_venta),
                  parseInt(producto.inventario?.stock || 0),
                  parseInt(producto.inventario?.cantidad_minima || 0)
                ]);
              });
              
              // Añadir información de resumen
              dataForExcel.push([]);
              dataForExcel.push(['Total productos', reportData.total_productos || reportData.productos.length]);
              
            } else if (reportSubType === 'categorias') {
              // Crear un libro con múltiples hojas para cada categoría
              
              // Hoja con resumen general
              let resumenData = [
                ['Reporte de Productos por Categorías'],
                ['Fecha de generación:', new Date().toLocaleDateString()],
                [],
                ['Total categorías:', reportData.total_categorias],
                []
              ];
              
              const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
              XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
              
              // Crear una hoja para cada categoría
              reportData.categorias.forEach(categoriaData => {
                let catData = [
                  [`Categoría: ${categoriaData.categoria.nombre}`],
                  ['Descripción:', categoriaData.categoria.descripcion || 'Sin descripción'],
                  [],
                  ['Total Productos:', categoriaData.resumen.total_productos],
                  ['Bajo Stock:', categoriaData.resumen.productos_bajo_stock],
                  ['Stock Total:', categoriaData.resumen.stock_total],
                  ['Stock Promedio:', categoriaData.resumen.stock_promedio],
                  ['Valor Total:', categoriaData.resumen.valor_total_inventario.toFixed(2) + ' Bs'],
                  ['Valor Promedio:', categoriaData.resumen.valor_promedio_producto.toFixed(2) + ' Bs'],
                  [],
                  ['ID', 'Producto', 'Precio (Bs)', 'Stock', 'Stock Mín.', 'Valor Stock (Bs)']
                ];
                
                categoriaData.productos.forEach(producto => {
                  catData.push([
                    producto.id,
                    producto.nombre,
                    parseFloat(producto.precio_venta.toFixed(2)),
                    producto.stock,
                    producto.stock_minimo,
                    parseFloat(producto.valor_stock.toFixed(2))
                  ]);
                });
                
                const ws = XLSX.utils.aoa_to_sheet(catData);
                XLSX.utils.book_append_sheet(wb, ws, categoriaData.categoria.nombre.substring(0, 30));
              });
              
              // Guardar el archivo Excel
              XLSX.writeFile(wb, fileName);
              setLoading(false);
              return;
            }
            break;
          
          case 'ventas':
            // Implementar para ventas
            if (reportSubType === 'general') {
              sheetName = 'Ventas';
              
              // Encabezados
              dataForExcel.push([
                'ID', 'Fecha', 'Cliente', 'Estado', 'Items', 'Total (Bs)', 'Método de Pago'
              ]);
              
              // Datos
              reportData.ventas.forEach(venta => {
                dataForExcel.push([
                  venta.id,
                  venta.fecha,
                  venta.cliente,
                  venta.estado,
                  venta.cantidad_items,
                  parseFloat(venta.total.toFixed(2)),
                  venta.metodos_pago?.map(m => `${m.tipo}: ${m.monto.toFixed(2)} Bs`).join(', ') || ''
                ]);
              });
              
              // Añadir información de resumen
              dataForExcel.push([]);
              dataForExcel.push(['Total Ventas (Bs):', parseFloat(reportData.resumen?.total_ventas_bs?.toFixed(2) || 0)]);
              dataForExcel.push(['Cantidad de Ventas:', reportData.resumen?.cantidad_ventas || 0]);
              dataForExcel.push(['Promedio por Venta (Bs):', parseFloat(reportData.resumen?.promedio_venta?.toFixed(2) || 0)]);
            } else if (reportSubType === 'productos') {
              sheetName = 'VentasProductos';
              
              // Encabezados
              dataForExcel.push([
                'ID', 'Producto', 'Cantidad Vendida', 'Precio Promedio (Bs)', 'Total Ventas (Bs)'
              ]);
              
              // Datos
              reportData.productos.forEach(producto => {
                dataForExcel.push([
                  producto.id,
                  producto.nombre,
                  producto.cantidad_vendida,
                  parseFloat(producto.precio_promedio?.toFixed(2) || 0),
                  parseFloat(producto.ventas_total?.toFixed(2) || 0)
                ]);
              });
            }
            break;
            
          case 'clientes':
            sheetName = 'Clientes';
            
            // Encabezados
            dataForExcel.push([
              'ID', 'Nombre', 'Cédula', 'Teléfono', 'Email', 'Dirección'
            ]);
            
            // Datos
            reportData.clientes.forEach(cliente => {
              dataForExcel.push([
                cliente.id,
                cliente.nombre,
                cliente.cedula_identidad || '',
                cliente.telefono || '',
                cliente.email || '',
                cliente.direccion || ''
              ]);
            });
            
            // Añadir información de resumen
            dataForExcel.push([]);
            dataForExcel.push(['Total Clientes:', reportData.resumen?.total_clientes || reportData.clientes.length]);
            break;
            
          case 'caja':
            sheetName = 'Cajas';
            
            // Encabezados
            dataForExcel.push([
              'ID', 'Apertura', 'Cierre', 'Estado', 'Inicial (Bs)', 'Final (Bs)', 
              'Efectivo (Bs)', 'QR (Bs)', 'Tarjeta (Bs)', 'Ventas'
            ]);
            
            // Datos
            reportData.cajas.forEach(caja => {
              dataForExcel.push([
                caja.id,
                caja.fecha_apertura,
                caja.fecha_cierre,
                caja.estado,
                parseFloat(caja.monto_inicial?.toFixed(2) || 0),
                parseFloat(caja.monto_final?.toFixed(2) || 0),
                parseFloat(caja.total_efectivo?.toFixed(2) || 0),
                parseFloat(caja.total_qr?.toFixed(2) || 0),
                parseFloat(caja.total_tarjeta?.toFixed(2) || 0),
                caja.total_ventas || 0
              ]);
            });
            
            // Añadir información de resumen si hay totales generales
            if (reportData.total_general) {
              dataForExcel.push([]);
              dataForExcel.push(['Total Cajas:', reportData.total_cajas || reportData.cajas.length]);
              dataForExcel.push(['Monto Inicial Total (Bs):', parseFloat(reportData.total_general.monto_inicial_total?.toFixed(2) || 0)]);
              dataForExcel.push(['Monto Final Total (Bs):', parseFloat(reportData.total_general.monto_final_total?.toFixed(2) || 0)]);
              dataForExcel.push(['Total Ventas:', reportData.total_general.total_ventas || 0]);
            }
            break;
            
          case 'movimientos':
            // Crear un libro con hojas para movimientos por caja
            const wbMov = XLSX.utils.book_new();
            
            // Hoja de resumen
            if (reportData.resumen) {
              let resumenData = [
                ['Reporte de Movimientos'],
                ['Fecha de generación:', new Date().toLocaleDateString()],
                [],
                ['Total Movimientos:', reportData.resumen.total_movimientos || 0],
                ['Total Ingresos (Bs):', parseFloat(reportData.resumen.total_ingresos?.toFixed(2) || 0)],
                ['Total Retiros (Bs):', parseFloat(reportData.resumen.total_retiros?.toFixed(2) || 0)],
                ['Balance Neto (Bs):', parseFloat(reportData.resumen.balance_neto?.toFixed(2) || 0)]
              ];
              
              const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
              XLSX.utils.book_append_sheet(wbMov, wsResumen, 'Resumen');
            }
            
            // Crear una hoja para cada caja
            reportData.cajas.forEach((cajaData, index) => {
              let cajaTitle = `Caja #${cajaData.caja_id || index + 1}`;
              
              let movData = [
                [cajaTitle],
                ['Empleado:', cajaData.empleado || 'N/A'],
                ['Apertura:', cajaData.fecha_apertura],
                ['Estado:', cajaData.estado_caja],
                ['Ingresos (Bs):', parseFloat(cajaData.total_ingresos?.toFixed(2) || 0)],
                ['Retiros (Bs):', parseFloat(cajaData.total_retiros?.toFixed(2) || 0)],
                [],
                ['ID', 'Fecha', 'Tipo', 'Monto (Bs)', 'Descripción']
              ];
              
              if (cajaData.movimientos && cajaData.movimientos.length > 0) {
                cajaData.movimientos.forEach(movimiento => {
                  movData.push([
                    movimiento.id,
                    movimiento.fecha,
                    movimiento.tipo,
                    parseFloat(movimiento.monto.toFixed(2)),
                    movimiento.descripcion || ''
                  ]);
                });
                
                movData.push([]);
                movData.push(['Balance (Bs):', parseFloat(cajaData.balance_neto?.toFixed(2) || 0)]);
              } else {
                movData.push(['No hay movimientos registrados para esta caja']);
              }
              
              const ws = XLSX.utils.aoa_to_sheet(movData);
              XLSX.utils.book_append_sheet(wbMov, ws, `Caja_${cajaData.caja_id || index + 1}`);
            });
            
            // Guardar el archivo Excel
            XLSX.writeFile(wbMov, fileName);
            setLoading(false);
            return;
            
          default:
            alert(`Exportación a Excel para reportes de ${reportType} no implementada.`);
            setLoading(false);
            return;
        }
        
        // Si llegamos aquí, significa que no hemos retornado temprano y vamos a crear una hoja simple
        
        // Crear una hoja de Excel
        const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
        
        // Aplicar estilos a la hoja de Excel (opcional)
        function applyStyles(ws) {
          // Obtener el rango ocupado
          const range = XLSX.utils.decode_range(ws['!ref']);
          
          // Crear un estilo para encabezados
          const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "center" }
          };
          
          // Aplicar estilo a la fila de encabezados
          for(let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({r: 0, c: C});
            if(!ws[cell_address]) continue;
            ws[cell_address].s = headerStyle;
          }
          
          // Ajustar anchos de columna automáticamente
          const colWidths = [];
          for(let C = range.s.c; C <= range.e.c; ++C) {
            let maxLen = 10; // Ancho mínimo
            
            for(let R = range.s.r; R <= range.e.r; ++R) {
              const cell_address = XLSX.utils.encode_cell({r: R, c: C});
              if(!ws[cell_address]) continue;
              
              const cellText = String(ws[cell_address].v || '');
              maxLen = Math.max(maxLen, cellText.length * 1.2);
            }
            
            colWidths[C] = { wch: maxLen };
          }
          
          ws['!cols'] = colWidths;
          
          return ws;
        }
        
        applyStyles(ws); // Aplicar estilos
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Guardar el archivo Excel
        XLSX.writeFile(wb, fileName);
      }
    } catch (error) {
      console.error('Error al exportar a ' + formato + ':', error);
      alert(`Error al exportar a ${formato}: ${error.message}`);
    } finally {
      // Asegurarse de desactivar el estado de carga
      setLoading(false);
    }
  };

  // Renderizar reporte de ventas
  const renderVentasReport = () => {
    console.log("Renderizando reporte de ventas:", reportData);
    
    if (!reportData) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver las ventas.
          </p>
        </div>
      );
    }
    
    if (reportData.message && reportData.message.includes('No se encontraron')) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay ventas disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron ventas para el período especificado.
          </p>
        </div>
      );
    }
    
    if (reportSubType === 'general') {
      if (!reportData.ventas || reportData.ventas.length === 0) {
        return (
          <div className="text-center text-gray-600 dark:text-gray-300 p-10">
            <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay ventas registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron ventas para el período especificado.
            </p>
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Resumen de Ventas</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Ventas</p>
                <p className="text-2xl font-bold">{reportData.resumen?.total_ventas_bs?.toFixed(2) || '0.00'} Bs</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Cantidad de Ventas</p>
                <p className="text-2xl font-bold">{reportData.resumen?.cantidad_ventas || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Promedio por Venta</p>
                <p className="text-2xl font-bold">{reportData.resumen?.promedio_venta?.toFixed(2) || '0.00'} Bs</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Items Vendidos</p>
                <p className="text-2xl font-bold">{reportData.resumen?.total_items_vendidos || 0}</p>
              </div>
            </div>
            
            {reportData.resumen?.ventas_por_metodo_pago && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Ventas por Método de Pago</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.entries(reportData.resumen.ventas_por_metodo_pago).map(([metodo, monto]) => (
                    <div key={metodo} className="bg-white p-2 rounded border">
                      <p className="text-xs text-gray-500">{metodo}</p>
                      <p className="font-medium">{parseFloat(monto).toFixed(2)} Bs</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.estado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cantidad_items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{venta.total.toFixed(2)} Bs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.metodos_pago?.map((metodo, idx) => (
                      <span key={idx} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs mr-1">
                        {metodo.tipo}: {metodo.monto.toFixed(2)} Bs
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="5" className="px-6 py-4 text-right text-sm font-medium">Total:</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{reportData.resumen?.total_ventas_bs?.toFixed(2) || '0.00'} Bs</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
    
    if (reportSubType === 'productos') {
      if (!reportData.productos || reportData.productos.length === 0) {
        return (
          <div className="text-center text-gray-600 dark:text-gray-300 p-10">
            <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay productos vendidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron productos vendidos para el período especificado.
            </p>
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Ventas por Productos</h4>
            <p>Total productos vendidos: {reportData.total_productos_vendidos || reportData.productos.length}</p>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Vendida</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ventas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{producto.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.cantidad_vendida}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.precio_promedio?.toFixed(2) || '0.00'} Bs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{producto.ventas_total?.toFixed(2) || '0.00'} Bs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (reportSubType === 'clientes') {
      if (!reportData.clientes || reportData.clientes.length === 0) {
        return (
          <div className="text-center text-gray-600 dark:text-gray-300 p-10">
            <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay ventas por clientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron ventas por clientes para el período especificado.
            </p>
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Ventas por Cliente</h4>
            <p>Total clientes: {reportData.total_clientes || reportData.clientes.length}</p>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad de Ventas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ventas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio por Venta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{cliente.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.cantidad_ventas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{cliente.total_ventas?.toFixed(2) || '0.00'} Bs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.cantidad_ventas > 0 ? (cliente.total_ventas / cliente.cantidad_ventas).toFixed(2) : '0.00'} Bs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return (
      <div className="text-center text-gray-600 dark:text-gray-300 p-10">
        <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Subtipo de reporte no reconocido</h3>
        <p className="mt-1 text-sm text-gray-500">
          El subtipo "{reportSubType}" no está implementado aún.
        </p>
      </div>
    );
  };

  // Renderizar reporte de productos
  const renderProductosReport = () => {
    if (!reportData) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona un tipo de reporte y haz clic en "Generar Reporte" para ver los productos.
          </p>
        </div>
      );
    }

    if (reportData.message && reportData.message.includes('No se encontraron')) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay productos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron productos para los filtros especificados.
          </p>
        </div>
      );
    }

    if (reportSubType === 'categorias') {
      if (!reportData.categorias || reportData.categorias.length === 0) {
        return (
          <div className="text-center text-gray-600 dark:text-gray-300 p-10">
            <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay categorías disponibles</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron categorías con productos para mostrar.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Reporte por Categorías</h4>
            <p>Total categorías: {reportData.total_categorias}</p>
            {reportData.categoria_filtro && (
              <p className="text-sm text-gray-600">Filtrado por categoría ID: {reportData.categoria_filtro}</p>
            )}
          </div>

          {reportData.categorias.map((categoriaData) => (
            <div key={categoriaData.categoria.id} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h5 className="text-lg font-medium mb-2">
                  {categoriaData.categoria.nombre}
                  {categoriaData.categoria.descripcion && (
                    <span className="text-sm text-gray-500 ml-2">- {categoriaData.categoria.descripcion}</span>
                  )}
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Total Productos</p>
                    <p className="font-medium text-sm">{categoriaData.resumen.total_productos}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Bajo Stock</p>
                    <p className="font-medium text-sm text-red-600">{categoriaData.resumen.productos_bajo_stock}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Stock Total</p>
                    <p className="font-medium text-sm">{categoriaData.resumen.stock_total}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Stock Promedio</p>
                    <p className="font-medium text-sm">{categoriaData.resumen.stock_promedio}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Valor Total</p>
                    <p className="font-medium text-sm">{categoriaData.resumen.valor_total_inventario.toFixed(2)} Bs</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Valor Promedio</p>
                    <p className="font-medium text-sm">{categoriaData.resumen.valor_promedio_producto.toFixed(2)} Bs</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock Mín.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Stock</th>
                      {/* Se eliminó la columna de Estado */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriaData.productos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">#{producto.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{producto.nombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{producto.precio_venta.toFixed(2)} Bs</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{producto.stock}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{producto.stock_minimo}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{producto.valor_stock.toFixed(2)} Bs</td>
                        {/* Se eliminó la celda de Estado */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Resto del código para otros subtipos (inventario, stock_bajo)...
    if (!reportData.productos || reportData.productos.length === 0) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay productos registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron productos para los filtros especificados.
          </p>
        </div>
      );
    }
    
    if (reportSubType === 'inventario') {
      return (
        <div className="overflow-x-auto">
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Resumen de Inventario</h4>
            <div className="space-y-1">
              <p>Total productos: {reportData.total_productos || reportData.productos.length}</p>
              {reportData.categoria_info && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <strong>Filtrado por categoría:</strong> {reportData.categoria_info.nombre}
                  {reportData.categoria_info.descripcion && (
                    <span className="text-gray-600"> - {reportData.categoria_info.descripcion}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                {/* Se eliminó la columna de Estado */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{producto.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.categoria?.nombre || 'Sin categoría'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.precio_venta} Bs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.inventario?.stock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.inventario?.cantidad_minima || 0}</td>
                  {/* Se eliminó la celda de Estado */}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  Total de productos: {reportData.productos.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
    
    return (
      <div className="text-center text-gray-600 dark:text-gray-300 p-10">
        <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Reporte en desarrollo</h3>
        <p className="mt-1 text-sm text-gray-500">
          El subtipo "{reportSubType}" está en desarrollo.
        </p>
      </div>
    );
  };

  // Renderizar reporte de clientes (actualizado)
  const renderClientesReport = () => {
    if (!reportData) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Haz clic en "Generar Reporte" para ver los clientes registrados.
          </p>
        </div>
      );
    }
    
    if (reportData.message && reportData.message.includes('No se encontraron')) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay clientes disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron clientes registrados en el sistema.
          </p>
        </div>
      );
    }
    
    if (!reportData.clientes || reportData.clientes.length === 0) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay clientes registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron clientes registrados en el sistema.
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <div className="p-4 mb-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-lg mb-2">Reporte de Clientes Registrados</h4>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="bg-white p-3 rounded-md border">
              <p className="text-gray-500 text-sm">Total Clientes</p>
              <p className="text-2xl font-bold">{reportData.resumen?.total_clientes || reportData.clientes.length}</p>
            </div>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{cliente.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{cliente.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.cedula_identidad ? cliente.cedula_identidad : (
                    <span className="text-gray-400 italic">Sin registrar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.telefono ? cliente.telefono : (
                    <span className="text-gray-400 italic">Sin registrar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.email ? cliente.email : (
                    <span className="text-gray-400 italic">Sin registrar</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                  {cliente.direccion ? (
                    <span className="truncate block" title={cliente.direccion}>
                      {cliente.direccion}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Sin registrar</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                Total de clientes: {reportData.clientes.length}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // Renderizar reporte de caja
  const renderCajaReport = () => {
    if (!reportData) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver la información de caja.
          </p>
        </div>
      );
    }
    
    if (reportData.message && reportData.message.includes('No se encontraron')) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos de caja disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron datos de caja para el período especificado.
          </p>
        </div>
      );
    }
    
    if (!reportData.cajas || reportData.cajas.length === 0) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay cajas registradas</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron cajas para el período especificado.
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        {reportData.total_general && (
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Resumen General de Cajas</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Cajas</p>
                <p className="text-2xl font-bold">{reportData.total_cajas || reportData.cajas.length}</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Monto Inicial Total</p>
                <p className="text-2xl font-bold">{reportData.total_general.monto_inicial_total?.toFixed(2) || '0.00'} Bs</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Monto Final Total</p>
                <p className="text-2xl font-bold">{reportData.total_general.monto_final_total?.toFixed(2) || '0.00'} Bs</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Ventas</p>
                <p className="text-2xl font-bold">{reportData.total_general.total_ventas || 0}</p>
              </div>
            </div>
          </div>
        )}
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apertura</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cierre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicial</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.cajas.map((caja) => (
              <tr key={caja.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{caja.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.fecha_apertura}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.fecha_cierre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs 
                    ${caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {caja.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.monto_inicial?.toFixed(2) || '0.00'} Bs</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.monto_final?.toFixed(2) || '0.00'} Bs</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.total_efectivo?.toFixed(2) || '0.00'} Bs</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.total_qr?.toFixed(2) || '0.00'} Bs</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.total_tarjeta?.toFixed(2) || '0.00'} Bs</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caja.total_ventas || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar reporte de movimientos
  const renderMovimientosReport = () => {
    console.log("Renderizando reporte de movimientos:", reportData);
    
    if (!reportData) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver los movimientos de caja.
          </p>
        </div>
      );
    }
    
    if (reportData.message && reportData.message.includes('No se encontraron')) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay movimientos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron movimientos de caja para el período especificado.
          </p>
        </div>
      );
    }
    
    if (!reportData.cajas || reportData.cajas.length === 0) {
      return (
        <div className="text-center text-gray-600 dark:text-gray-300 p-10">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay movimientos registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron movimientos de caja para el período especificado.
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        {reportData.resumen && (
          <div className="p-4 mb-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-lg mb-2">Resumen de Movimientos</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Movimientos</p>
                <p className="text-2xl font-bold">{reportData.resumen.total_movimientos || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.resumen.total_ingresos ? 
                    reportData.resumen.total_ingresos.toFixed(2) : '0.00'} Bs
                </p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Total Retiros</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.resumen.total_retiros ? 
                    reportData.resumen.total_retiros.toFixed(2) : '0.00'} Bs
                </p>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <p className="text-gray-500 text-sm">Balance Neto</p>
                <p className={`text-2xl font-bold ${
                  (reportData.resumen.balance_neto || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.resumen.balance_neto ? 
                    reportData.resumen.balance_neto.toFixed(2) : '0.00'} Bs
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {reportData.cajas.map((cajaData, index) => (
            <div key={cajaData.caja_id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h5 className="text-lg font-medium mb-2">
                  Caja #{cajaData.caja_id} - {cajaData.empleado || 'N/A'}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Apertura</p>
                    <p className="font-medium text-sm">{cajaData.fecha_apertura}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Estado</p>
                    <p className="font-medium text-sm">{cajaData.estado_caja}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Ingresos</p>
                    <p className="font-medium text-sm text-green-600">
                      {cajaData.total_ingresos ? cajaData.total_ingresos.toFixed(2) : '0.00'} Bs
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-sm">Retiros</p>
                    <p className="font-medium text-sm text-red-600">
                      {cajaData.total_retiros ? cajaData.total_retiros.toFixed(2) : '0.00'} Bs
                    </p>
                  </div>
                </div>
              </div>
              
              {cajaData.movimientos && cajaData.movimientos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cajaData.movimientos.map((movimiento, idx) => (
                        <tr key={movimiento.id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{movimiento.id}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {movimiento.fecha}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-block rounded-full px-2 py-1 text-xs 
                              ${movimiento.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
                            </span>
                          </td>
                          <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium 
                            ${movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                            {movimiento.tipo === 'ingreso' ? '+' : '-'}{movimiento.monto.toFixed(2)} Bs
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {movimiento.descripcion || 'Sin descripción'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium">
                          Balance:
                        </td>
                        <td className={`px-4 py-2 text-sm font-bold 
                          ${(cajaData.balance_neto || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cajaData.balance_neto ? cajaData.balance_neto.toFixed(2) : '0.00'} Bs
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm">No hay movimientos registrados para esta caja</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Función para renderizar diferentes contenidos de reportes según el tipo
  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'ventas':
        return renderVentasReport();
      case 'productos':
        return renderProductosReport();
      case 'clientes':
        return renderClientesReport();
      case 'caja':
        return renderCajaReport();
      case 'movimientos':
        return renderMovimientosReport();
      default:
        return (
          <div className="text-center text-gray-600 p-10">
          <h3 className="text-lg font-medium">Tipo de reporte no implementado</h3>
          <p className="text-sm text-gray-500">El tipo "{reportType}" no está disponible aún.</p>
        </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaChartBar className="text-green-600" />
              Reportes del Sistema
            </h1>
          </div>

          {/* Filtros y controles */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Reporte
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ventas">Ventas</option>
                  <option value="productos">Productos</option>
                  <option value="clientes">Clientes</option>
                  <option value="caja">Caja</option>
                  <option value="movimientos">Movimientos de Caja</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtipo
                </label>
                <select
                  value={reportSubType}
                  onChange={(e) => setReportSubType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {subTypeOptions[reportType]?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Fecha Inicio
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Fecha Fin
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                {reportData && (
                  <>
                    <button
                      onClick={() => exportarReporte('pdf')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <FaFilePdf /> Exportar PDF
                    </button>
                    <button
                      onClick={() => exportarReporte('excel')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FaFileDownload /> Exportar Excel
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaFilter />} 
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <p className="font-medium">Error al generar el reporte:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-300 p-10">
                <span className="text-lg">Generando reporte...</span>
                <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : reportData ? (
              <div id="reporte-container">
                {renderReportContent()}
              </div>
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-300 p-10">
                <FaChartBar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona un tipo de reporte y un rango de fechas, luego haz clic en "Generar Reporte".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vistareportes;