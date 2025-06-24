import { useState, useEffect } from 'react';
import reporteService from '../../../services/reporteService';
import { adaptarDatos } from '../utils/reportDataAdapter';
import useReportExport from './useReportExport';

/**
 * Hook personalizado para manejar los datos de reportes
 */
const useReportData = () => {
  const [reportType, setReportType] = useState('ventas');
  const [reportSubType, setReportSubType] = useState('general');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [sucursalActual, setSucursalActual] = useState(null);

  // Inicializar la sucursal desde localStorage
  useEffect(() => {
    const sucursalId = localStorage.getItem('sucursal_actual_id');
    const sucursalNombre = localStorage.getItem('sucursal_actual_nombre');
    
    if (sucursalId && sucursalNombre) {
      setSucursalActual({
        id: parseInt(sucursalId),
        nombre: sucursalNombre
      });
    }
    
    // Escuchar cambios en localStorage para sucursal
    const handleStorageChange = (e) => {
      if (e.key === 'sucursal_actual_id' || e.key === 'sucursal_actual_nombre') {
        const newId = localStorage.getItem('sucursal_actual_id');
        const newNombre = localStorage.getItem('sucursal_actual_nombre');
        
        if (newId && newNombre) {
          setSucursalActual({
            id: parseInt(newId),
            nombre: newNombre
          });
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Opciones de subtipos según el tipo de reporte
  const subTypeOptions = {
    ventas: [
      { value: 'general', label: 'General' },
      { value: 'productos', label: 'Por Productos' }
    ],
    productos: [
      { value: 'inventario', label: 'Inventario General' },
      { value: 'categorias', label: 'Por Categorías' },
      { value: 'agotados', label: 'Productos Agotados' }
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

  // Hook de exportación
  const { exportarReporte } = useReportExport(reportData, reportType, reportSubType);

  // Limpiar categoría seleccionada cuando se cambia el tipo de reporte
  useEffect(() => {
    if (subTypeOptions[reportType] && subTypeOptions[reportType].length > 0) {
      setReportSubType(subTypeOptions[reportType][0].value);
    }
    setReportData(null);
  }, [reportType]);

  /**
   * Genera un reporte basado en el tipo y subtipo seleccionado
   */
  const generateReport = async () => {
    // Validación básica
    if (!sucursalActual) {
      setError("Debe seleccionar una sucursal para generar reportes");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Generando reporte:', { 
        tipo: reportType, 
        subtipo: reportSubType, 
        fechas: dateRange,
        sucursal: sucursalActual
      });

      // Preparar filtros comunes
      const filtros = {
        fecha_inicio: dateRange.startDate,
        fecha_fin: dateRange.endDate,
      };

      // Agregar filtro de categoría para productos si es necesario
      if (reportType === 'productos' && selectedCategoria) {
        filtros.categoria_id = selectedCategoria;
      }
      
      // No es necesario agregar sucursal_id ya que reporteService
      // la añade automáticamente desde localStorage

      // Generar reporte según el tipo seleccionado
      let data;

      switch (reportType) {
        case 'productos':
          data = await reporteService.getReporteProductos({ 
            tipo: reportSubType, 
            filtros 
          });
          break;
          
        case 'ventas':
          data = await reporteService.getReporteVentas({ 
            tipo: reportSubType, 
            filtros 
          });
          break;
          
        case 'clientes':
          data = await reporteService.getReporteClientes({ 
            tipo: reportSubType, 
            filtros 
          });
          break;
          
        case 'caja':
          data = await reporteService.getReporteCaja({ 
            tipo: reportSubType, 
            filtros 
          });
          break;
          
        case 'movimientos':
          data = await reporteService.getReporteMovimientos(filtros);
          break;
          
        default:
          throw new Error(`Tipo de reporte no válido: ${reportType}`);
      }
      
      // Adaptar los datos recibidos del API según sea necesario
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

  /**
   * Exporta el reporte actual en el formato especificado
   */
  const exportReport = (formato) => {
    if (!reportData) {
      setError("Primero debe generar un reporte para exportar");
      return;
    }
    
    if (formato === 'pdf') {
      exportarReporte('pdf');
    } else if (formato === 'excel') {
      exportarReporte('excel');
    }
  };

  return {
    reportType,
    setReportType,
    reportSubType, 
    setReportSubType,
    reportData,
    loading,
    error,
    dateRange,
    setDateRange,
    categorias,
    selectedCategoria,
    setSelectedCategoria,
    generateReport,
    subTypeOptions,
    exportReport,
    sucursalActual
  };
};

export default useReportData;