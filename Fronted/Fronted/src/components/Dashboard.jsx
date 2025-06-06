import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

const Dashboard = () => {
  // Obtenemos el contexto del AdminLayout 
  const [ , , , setActivePage ] = useOutletContext();

  // Aseguramos que el título de la página sea "Dashboard"
  useEffect(() => {
    setActivePage("Dashboard");
  }, [setActivePage]);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Ventas del día</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">120</div>
          <p className="text-sm text-green-600 dark:text-green-400">+15% vs. ayer</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Transacciones</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">42</div>
          <p className="text-sm text-green-600 dark:text-green-400">+8% vs. ayer</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Ticket Promedio</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">$29.75</div>
          <p className="text-sm text-green-600 dark:text-green-400">+5% vs. ayer</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Facturas Pendientes</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">7</div>
          <p className="text-sm text-red-600 dark:text-red-400">Requiere atención</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Ventas de la Semana</h3>
          <div className="h-44 bg-gradient-to-r from-green-500 to-blue-500 rounded-md flex items-center justify-center text-white">
            <span className="text-lg">Gráfico de Ventas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Productos Más Vendidos</h3>
          <ul className="space-y-4">
            <li className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Laptop HP 15"</span>
              <span>125 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Monitor Samsung 24"</span>
              <span>98 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Mouse Logitech</span>
              <span>87 vendidos</span>
            </li>
            <li className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Teclado Mecánico</span>
              <span>65 vendidos</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenedores inferiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Alertas de Inventario</h3>
          <ul className="space-y-4">
            <li className="flex justify-between p-3 bg-red-100 dark:bg-red-800 rounded-md">
              <span>Mouse Inalámbrico - Stock crítico (2)</span>
              <span>Mínimo: 10</span>
            </li>
            <li className="flex justify-between p-3 bg-yellow-100 dark:bg-yellow-800 rounded-md">
              <span>Pantalla Táctil - Stock bajo (8)</span>
              <span>Mínimo: 15</span>
            </li>
            <li className="flex justify-between p-3 bg-red-100 dark:bg-red-800 rounded-md">
              <span>Cable HDMI - Sin stock</span>
              <span>Mínimo: 25</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-gray-600 dark:text-gray-300 text-lg">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">Nueva Venta</button>
            <button className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">Nuevo Producto</button>
            <button className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">Nueva Factura</button>
            <button className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">Reportes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
