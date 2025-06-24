import React from 'react';

const ReportError = ({ message }) => {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
      <p className="font-medium">Error al generar el reporte:</p>
      <p>{message}</p>
    </div>
  );
};

export default ReportError;