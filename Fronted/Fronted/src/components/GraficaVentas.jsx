import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList 
} from 'recharts';
import { pedidoService } from "../services/pedidoService";

const GraficaVentas = () => {
  const [datosVentas, setDatosVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerVentasSemana = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Obtener ID del usuario y sucursal actual
        const userId = localStorage.getItem('id');
        const sucursalId = localStorage.getItem('sucursal_actual_id');
        
        // Calcular el rango de fechas para la semana actual
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        // Encontrar el lunes de esta semana
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));
        inicioSemana.setHours(0, 0, 0, 0);
        
        // Encontrar el domingo de esta semana
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        finSemana.setHours(23, 59, 59, 999);
        
        console.log('Semana actual:', inicioSemana.toISOString(), 'a', finSemana.toISOString());
        
        // Obtener pedidos
        let pedidos;
        if (sucursalId) {
          pedidos = await pedidoService.getPedidosBySucursal(userId, sucursalId);
        } else {
          pedidos = await pedidoService.getAllPedidos();
        }
        
        // Crear arreglo con los 7 días de la semana
        const diasSemana = [];
        const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(inicioSemana);
          fecha.setDate(inicioSemana.getDate() + i);
          
          diasSemana.push({
            fecha: fecha,
            nombre: nombresDias[i],
            fechaStr: fecha.toISOString().split('T')[0],
            total: 0,
            cantidad: 0,
            esFuturo: fecha > hoy,
            esHoy: fecha.toISOString().split('T')[0] === hoy.toISOString().split('T')[0]
          });
        }
        
        // Filtrar y agrupar pedidos por día
        pedidos.forEach(pedido => {
          const fechaPedido = new Date(pedido.fecha).toISOString().split('T')[0];
          const diaEncontrado = diasSemana.find(dia => dia.fechaStr === fechaPedido);
          
          if (diaEncontrado) {
            diaEncontrado.total += parseFloat(pedido.total || 0);
            diaEncontrado.cantidad += 1;
          }
        });
        
        // Formatear para mostrar en la gráfica
        const datosProcesados = diasSemana.map(dia => ({
          name: dia.nombre,
          ventas: dia.total,
          cantidad: dia.cantidad,
          fecha: dia.fechaStr,
          esFuturo: dia.esFuturo,
          esHoy: dia.esHoy
        }));
        
        setDatosVentas(datosProcesados);
        
      } catch (error) {
        console.error('Error al obtener datos para la gráfica:', error);
        setError('No se pudieron cargar los datos de ventas semanales');
      } finally {
        setCargando(false);
      }
    };
    
    obtenerVentasSemana();
  }, []);

  // Formateador de moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white shadow-md rounded-md border border-gray-200">
          <p className="font-medium text-gray-700">{label}</p>
          <p className="text-green-600 font-medium">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-gray-500">
            {payload[0].payload.cantidad} ventas
          </p>
        </div>
      );
    }
    return null;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-44">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Cargando gráfica...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md h-44 flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={datosVentas}
        margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis 
          tickFormatter={formatCurrency}
          width={60} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="ventas" 
          name="Ventas" 
          fill="#10B981" 
          radius={[4, 4, 0, 0]}
          barSize={30}
        >
          {datosVentas.map((entry, index) => (
            <rect 
              key={`rect-${index}`}
              fill={entry.esHoy ? '#047857' : entry.esFuturo ? '#D1FAE5' : '#10B981'}
              fillOpacity={entry.esFuturo ? 0.3 : 1}
            />
          ))}
          <LabelList 
            dataKey="ventas" 
            position="top" 
            formatter={formatCurrency} 
            style={{ fontSize: '11px', fill: '#4B5563' }} 
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GraficaVentas;