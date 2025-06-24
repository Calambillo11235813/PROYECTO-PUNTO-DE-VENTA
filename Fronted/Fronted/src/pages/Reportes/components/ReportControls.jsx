import React from 'react';
import { FaCalendarAlt, FaFilter, FaSpinner, FaFilePdf, FaFileDownload, FaStore } from 'react-icons/fa';

const ReportControls = ({
  reportType,
  setReportType,
  reportSubType,
  setReportSubType,
  dateRange,
  setDateRange,
  subTypeOptions,
  reportData,
  loading,
  onGenerateReport,
  onExportReport,
  sucursalActual
}) => {
  return (
    <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "var(--bg-report-section)" }}>
      {/* Indicador de Sucursal Actual */}
      {
        sucursalActual && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <FaStore className="text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Reportes filtrados por sucursal:</p>
                <p className="font-medium text-green-700">{sucursalActual.nombre}</p>
              </div>
            </div>
          </div>
        )
      }
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Control para tipo de reporte */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--bg-terciario)", 
              color: "var(--text-primary)",
              borderColor: "var(--accent-color)",
            }}
          >
            <option value="ventas">Ventas</option>
            <option value="productos">Productos</option>
            <option value="clientes">Clientes</option>
            <option value="caja">Caja</option>
            <option value="movimientos">Movimientos de Caja</option>
          </select>
        </div>
        
        {/* Control para subtipo */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Subtipo
          </label>
          <select
            value={reportSubType}
            onChange={(e) => setReportSubType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--bg-terciario)", 
              color: "var(--text-primary)",
              borderColor: "var(--accent-color)",
            }}
          >
            {subTypeOptions[reportType]?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {/* Control para fecha inicio */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            <FaCalendarAlt className="inline mr-1" /> Fecha Inicio
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--bg-terciario)", 
              color: "var(--text-primary)",
              borderColor: "var(--accent-color)",
            }}
          />
        </div>
        
        {/* Control para fecha fin */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            <FaCalendarAlt className="inline mr-1" /> Fecha Fin
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--bg-terciario)", 
              color: "var(--text-primary)",
              borderColor: "var(--accent-color)",
            }}
          />
        </div>
      </div>
      
      {/* Botones para exportar y generar */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-2">
          {reportData && (
            <>
              <button
                onClick={() => onExportReport('pdf')}
                className="px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <FaFilePdf /> Exportar PDF
              </button>
              <button
                onClick={() => onExportReport('excel')}
                className="px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <FaFileDownload /> Exportar Excel
              </button>
            </>
          )}
        </div>
        <button
          onClick={onGenerateReport}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: "var(--accent-color)" }}
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaFilter />} 
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>
    </div>
  );
};

export default ReportControls;