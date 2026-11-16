import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, PieChart } from 'lucide-react';
import { posApi } from '../../services/api';

export default function ReportsScreen() {
  const [reportData, setReportData] = useState({
    totales: { total_ventas: 0, monto_total: 0, ganancia_total: 0 },
    ventasPorDia: [],
    ventasPorDepto: []
  });
  const [periodo, setPeriodo] = useState('semana');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    const data = await posApi.getSalesReport();
    setReportData(data);
  };

  const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Título */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <BarChart3 size={17} />
          <h2 className="text-sm font-bold uppercase tracking-wider">REPORTES DE VENTAS Y GANANCIAS</h2>
        </div>
      </div>

      {/* Sub-barra de Periodos */}
      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-4 py-1.5 flex items-center space-x-2 text-xs">
        {['Semana Actual', 'Mes Actual', 'Mes Anterior', 'Año Actual'].map((label, idx) => (
          <button
            key={label}
            onClick={() => setPeriodo(label.toLowerCase())}
            className={`px-3 py-1 rounded font-bold transition ${
              idx === 0
                ? 'bg-white text-blue-900 shadow-2xs border border-blue-300'
                : 'text-gray-700 hover:bg-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de Reportes Pantalla 10 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Tarjetas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ventas Totales Registradas</div>
            <div className="text-3xl font-black text-blue-900 font-mono mt-1">
              ${Number(reportData.totales.monto_total || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {reportData.totales.total_ventas || 0} tickets emitidos
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ganancia Bruta Estimada</div>
            <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
              ${Number(reportData.totales.ganancia_total || 0).toFixed(2)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              Margen de utilidad directo
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ticket Promedio</div>
            <div className="text-3xl font-black text-gray-800 font-mono mt-1">
              $
              {reportData.totales.total_ventas > 0
                ? (reportData.totales.monto_total / reportData.totales.total_ventas).toFixed(2)
                : '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Por cliente atendido</div>
          </div>
        </div>

        {/* Sección de Gráficos y Distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Departamento */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 flex flex-col">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5 border-b border-gray-200 pb-2">
              <PieChart size={16} className="text-blue-600" />
              <span>Ventas y Ganancias por Departamento</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {reportData.ventasPorDepto.length > 0 ? (
                reportData.ventasPorDepto.map((dept, idx) => (
                  <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{dept.departamento}</div>
                      <div className="text-gray-500 text-[11px]">{dept.cantidad_articulos} artículos vendidos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-blue-900">${Number(dept.total_venta).toFixed(2)}</div>
                      <div className="font-mono text-[11px] font-semibold text-emerald-700">
                        Ganancia: ${Number(dept.total_ganancia).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No hay ventas registradas por departamento aún.
                </div>
              )}
            </div>
          </div>

          {/* Resumen por Día de la Semana */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 flex flex-col">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5 border-b border-gray-200 pb-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <span>Ventas por Día de la Semana</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2">
              {diasSemanaNombres.map((nombreDia, diaIdx) => {
                const diaData = reportData.ventasPorDia.find((d) => Number(d.dia_semana) === diaIdx);
                const ventaMonto = diaData ? Number(diaData.total_venta) : 0;
                return (
                  <div key={nombreDia} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded border border-gray-100 text-xs">
                    <span className="font-bold text-gray-700 w-16">{nombreDia}</span>
                    <div className="flex-1 mx-3 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (ventaMonto / (reportData.totales.monto_total || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-gray-900 w-20 text-right">
                      ${ventaMonto.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
