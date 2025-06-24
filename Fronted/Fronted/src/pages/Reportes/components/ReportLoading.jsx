import React from 'react';

const ReportLoading = () => {
  return (
    <div className="flex flex-col items-center text-gray-600 dark:text-gray-300 p-10">
      <span className="text-lg">Generando reporte...</span>
      <div className="w-10 h-10 mt-4 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default ReportLoading;