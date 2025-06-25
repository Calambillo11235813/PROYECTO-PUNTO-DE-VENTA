import React from 'react';
import { FaChartBar } from 'react-icons/fa';

const ReportEmpty = ({ title, message }) => {
  return (
    <div className="text-center text-gray-600 dark:text-gray-300 p-10">
      <FaChartBar className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  );
};

export default ReportEmpty;