import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

const useReportExport = (reportData, reportType, reportSubType) => {
  const [exporting, setExporting] = useState(false);

  const exportarReporte = async (formato) => {
    if (!reportData) {
      alert('Genera un reporte primero');
      return;
    }

    try {
      setExporting(true);

      if (formato === 'pdf') {
        await exportToPdf();
      } else if (formato === 'excel') {
        await exportToExcel();
      }
    } catch (error) {
      console.error('Error al exportar a ' + formato + ':', error);
      alert(`Error al exportar a ${formato}: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Función para exportar a PDF
  const exportToPdf = async () => {
    // Obtener el elemento que contiene el reporte
    const element = document.getElementById('reporte-container');
    
    if (!element) {
      alert('Error: No se encontró el contenido del reporte');
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
          ${reportSubType ? ` - ${reportSubType}` : ''}
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
    
    // Aplicar cambios específicos según el tipo de reporte
    applyReportTypeSpecificChanges(pdfContainer);
    
    // Configuración para la exportación PDF
    const opt = getPdfOptions();
    
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
  };

  // Aplicar cambios específicos según el tipo de reporte
  const applyReportTypeSpecificChanges = (container) => {
    if (reportType === 'productos' || reportType === 'caja' || reportType === 'movimientos') {
      // Convertir cualquier grid responsiva en estructura de tabla para PDF
      const grids = container.querySelectorAll('.grid');
      grids.forEach(grid => {
        // Reemplazar con estructura de tabla
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
  };

  // Obtener opciones para la exportación PDF
  const getPdfOptions = () => {
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
    
    return opt;
  };

  // Función para exportar a Excel
  const exportToExcel = async () => {
    // Preparar los datos para Excel según el tipo de reporte
    let dataForExcel = [];
    let sheetName = '';
    let fileName = `Reporte_${reportType}_${reportSubType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    
    // Crear un nuevo libro de Excel aquí, ANTES de cualquier uso de wb
    const wb = XLSX.utils.book_new();
    
    switch (reportType) {
      case 'productos':
        await handleProductosExcelExport(wb, fileName);
        return;
      
      case 'ventas':
        await handleVentasExcelExport(wb, dataForExcel, sheetName, fileName);
        return;
        
      case 'clientes':
        await handleClientesExcelExport(wb, dataForExcel, sheetName, fileName);
        return;
        
      case 'caja':
        await handleCajaExcelExport(wb, dataForExcel, sheetName, fileName);
        return;
        
      case 'movimientos':
        await handleMovimientosExcelExport(wb, fileName);
        return;
        
      default:
        alert(`Exportación a Excel para reportes de ${reportType} no implementada.`);
        return;
    }
  };

  // Manejar exportación de productos
  const handleProductosExcelExport = async (wb, fileName) => {
    if (reportSubType === 'inventario') {
      // Preparar datos para reporte de inventario
      const sheetName = 'Inventario';
      let dataForExcel = [];
      
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

      // Crear hoja y agregarla al libro
      const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
      applyStyles(ws);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Guardar el archivo Excel
      XLSX.writeFile(wb, fileName);
      
    } else if (reportSubType === 'categorias') {
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
    }
  };

  // Manejar exportación de ventas
  const handleVentasExcelExport = async (wb, dataForExcel, sheetName, fileName) => {
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
    
    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    applyStyles(ws);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Guardar el archivo Excel
    XLSX.writeFile(wb, fileName);
  };

  // Manejar exportación de clientes
  const handleClientesExcelExport = async (wb, dataForExcel, sheetName, fileName) => {
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

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    applyStyles(ws);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Guardar el archivo Excel
    XLSX.writeFile(wb, fileName);
  };

  // Manejar exportación de caja
  const handleCajaExcelExport = async (wb, dataForExcel, sheetName, fileName) => {
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

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    applyStyles(ws);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Guardar el archivo Excel
    XLSX.writeFile(wb, fileName);
  };

  // Manejar exportación de movimientos
  const handleMovimientosExcelExport = async (wb, fileName) => {
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
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
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
      XLSX.utils.book_append_sheet(wb, ws, `Caja_${cajaData.caja_id || index + 1}`);
    });
    
    // Guardar el archivo Excel
    XLSX.writeFile(wb, fileName);
  };

  // Aplicar estilos a la hoja de Excel
  const applyStyles = (ws) => {
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
  };

  return {
    exportarReporte,
    exporting
  };
};

export default useReportExport;