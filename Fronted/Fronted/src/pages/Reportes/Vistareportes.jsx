import React from 'react';
import { FaChartBar } from 'react-icons/fa';
import useTheme from '../../hooks/useTheme';
import useReportData from './hooks/useReportData';

// Componentes
import ReportControls from './components/ReportControls';
import ReportError from './components/ReportError';
import ReportLoading from './components/ReportLoading';
import ReportEmpty from './components/ReportEmpty';

// Subcomponentes de reportes
import VentasReport from './components/reports/VentasReport';
import ProductosReport from './components/reports/ProductosReport';
import ClientesReport from './components/reports/ClientesReport';
import CajaReport from './components/reports/CajaReport';
import MovimientosReport from './components/reports/MovimientosReport';

/**
 * Componente principal para la vista de reportes
 */
const Vistareportes = () => {
  // Usar el hook de temas
  const { palette } = useTheme();

  // Utilizar hook personalizado para manejar los datos del reporte
  const { 
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
  } = useReportData();

  // Función para renderizar diferentes contenidos de reportes según el tipo
  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'ventas':
        return <VentasReport reportData={reportData} reportSubType={reportSubType} />;
      case 'productos':
        return <ProductosReport reportData={reportData} reportSubType={reportSubType} />;
      case 'clientes':
        return <ClientesReport reportData={reportData} />;
      case 'caja':
        return <CajaReport reportData={reportData} />;
      case 'movimientos':
        return <MovimientosReport reportData={reportData} />;
      default:
        return (
          <ReportEmpty 
            title="Tipo de reporte no implementado" 
            message={`El tipo "${reportType}" no está disponible aún.`} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="shadow-md rounded-lg p-6" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <FaChartBar style={{ color: "var(--accent-color)" }} />
              Reportes del Sistema
              {sucursalActual && (
                <span className="text-lg text-green-500 ml-2">
                  ({sucursalActual.nombre})
                </span>
              )}
            </h1>
          </div>

          {/* Controles de filtrado y exportación */}
          <ReportControls
            reportType={reportType}
            setReportType={setReportType}
            reportSubType={reportSubType}
            setReportSubType={setReportSubType}
            dateRange={dateRange}
            setDateRange={setDateRange}
            subTypeOptions={subTypeOptions}
            reportData={reportData}
            loading={loading}
            onGenerateReport={generateReport}
            onExportReport={exportReport}
            sucursalActual={sucursalActual}
          />

          {/* Mostrar errores si existen */}
          {error && <ReportError message={error} />}

          {/* Si no hay sucursal seleccionada */}
          {!sucursalActual && (
            <ReportEmpty 
              title="Sucursal no seleccionada" 
              message="Por favor seleccione una sucursal en el menú principal antes de generar reportes."
            />
          )}

          {/* Contenedor principal del reporte */}
          {sucursalActual && (
            <div className="border rounded-lg" style={{ 
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--bg-secondary)",
              color: "var(--text-primary)"
            }}>
              {loading ? (
                <ReportLoading />
              ) : reportData ? (
                <div id="reporte-container">
                  {renderReportContent()}
                </div>
              ) : (
                <ReportEmpty 
                  title="No hay datos disponibles" 
                  message="Selecciona un tipo de reporte y un rango de fechas, luego haz clic en 'Generar Reporte'."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vistareportes;

