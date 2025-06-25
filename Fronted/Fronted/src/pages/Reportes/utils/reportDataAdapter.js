/**
 * Adapta los datos recibidos del API según el tipo de reporte
 * @param {Object} data - Datos recibidos del API
 * @param {string} reportType - Tipo de reporte ('ventas', 'productos', etc.)
 * @returns {Object} - Datos estructurados según el tipo de reporte
 */
export const adaptarDatos = (data, reportType) => {
  console.log(`Adaptando datos para ${reportType}:`, data);
  
  // Si no hay datos, devolver null
  if (!data) return null;
  
  // Crear una copia de los datos para no modificar los originales
  let result = { ...data };

  switch (reportType) {
    case 'productos':
      // Asegurarnos que hay una lista de productos
      if (!result.productos) {
        result.productos = [];
      }
      
      // Formatear datos de productos para que sean consistentes
      if (result.productos && result.productos.length > 0) {
        result.productos = result.productos.map(p => ({
          ...p,
          precio_compra: parseFloat(p.precio_compra || 0),
          precio_venta: parseFloat(p.precio_venta || 0),
          stock_actual: parseInt(p.stock_actual || 0)
        }));
      }
      
      // Asegurarnos que tenemos un total de productos
      if (result.total_productos === undefined) {
        result.total_productos = result.productos.length;
      }
      
      // Añadir array de categorías si no existe
      if (!result.categorias) {
        result.categorias = [];
      }
      break;
      
    case 'ventas':
      // Asegurarse que tenemos un array de ventas
      if (!result.ventas) {
        result.ventas = [];
      }
      
      // Si no hay resumen, crearlo
      if (!result.resumen) {
        result.resumen = {
          total_ventas_bs: 0,
          cantidad_ventas: result.ventas.length,
          promedio_venta: 0,
          total_items_vendidos: 0
        };
      }
      
      // Convertir valores numéricos a números
      if (result.ventas && result.ventas.length > 0) {
        result.ventas = result.ventas.map(v => ({
          ...v,
          total: parseFloat(v.total || 0),
          cantidad_items: parseInt(v.cantidad_items || 0)
        }));
      }
      break;
    
    case 'clientes':
      // Asegurarse que tenemos un array de clientes
      if (!result.clientes) {
        result.clientes = [];
      }
      break;
      
    case 'caja':
      // Asegurarse que tenemos un array de cajas
      if (!result.cajas) {
        result.cajas = [];
      }
      
      // Convertir valores numéricos a números
      if (result.cajas && result.cajas.length > 0) {
        result.cajas = result.cajas.map(c => ({
          ...c,
          monto_inicial: parseFloat(c.monto_inicial || 0),
          monto_final: parseFloat(c.monto_final || 0),
          total_efectivo: parseFloat(c.total_efectivo || 0),
          total_qr: parseFloat(c.total_qr || 0),
          total_tarjeta: parseFloat(c.total_tarjeta || 0)
        }));
      }
      break;
      
    case 'movimientos':
      // Asegurarse que tenemos un array de movimientos
      if (!result.movimientos) {
        result.movimientos = [];
      }
      
      // Convertir valores numéricos a números
      if (result.movimientos && result.movimientos.length > 0) {
        result.movimientos = result.movimientos.map(m => ({
          ...m,
          monto: parseFloat(m.monto || 0)
        }));
      }
      break;
  }
  
  return result;
};