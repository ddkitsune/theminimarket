import React, { useState, useEffect } from 'react';
import { Scissors, X, Printer, CheckCircle } from 'lucide-react';
import { posApi } from '../../services/api';

export default function CorteModal({ isOpen, onClose, turnoId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && turnoId) {
      loadSummary();
    }
  }, [isOpen, turnoId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await posApi.getShiftSummary(turnoId);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scissors size={18} />
            <h2 className="text-base font-bold tracking-wide">Corte de Caja / Turno Actual</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {loading || !summary ? (
            <div className="py-12 text-center text-gray-500 text-sm">Cargando datos del turno...</div>
          ) : (
            <>
              {/* Tarjetas Superiores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-xs font-bold text-blue-700 uppercase">Ventas Totales del Turno</div>
                  <div className="text-3xl font-black text-blue-900 font-mono mt-1">
                    ${Number(summary.total_ventas).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {summary.total_transacciones} tickets cobrados
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Ganancia Estimada</div>
                  <div className="text-3xl font-black text-emerald-800 font-mono mt-1">
                    ${Number(summary.total_ganancia).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Margen directo de utilidad
                  </div>
                </div>
              </div>

              {/* Conciliación de Efectivo en Caja */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 mb-3">
                  Dinero en Caja (Efectivo Físico)
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Fondo inicial de caja:</span>
                    <span className="font-mono font-bold text-gray-800">${Number(summary.fondo_inicial).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 text-green-700">
                    <span>+ Ventas en efectivo:</span>
                    <span className="font-mono font-bold">+${Number(summary.total_ventas_efectivo).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 text-green-700">
                    <span>+ Entradas de efectivo (F7):</span>
                    <span className="font-mono font-bold">+${Number(summary.entradas_detalle).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 text-rose-600">
                    <span>- Salidas de efectivo (F8):</span>
                    <span className="font-mono font-bold">-${Number(summary.salidas_detalle).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-900">Total Efectivo que debe haber en caja:</span>
                    <span className="font-mono text-emerald-700 text-base">
                      ${Number(summary.efectivo_esperado).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose por Forma de Pago */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 mb-3">
                  Ventas Desglosadas por Método
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Efectivo</div>
                    <div className="font-mono font-bold text-gray-800 mt-1">${Number(summary.total_ventas_efectivo).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Tarjeta</div>
                    <div className="font-mono font-bold text-gray-800 mt-1">${Number(summary.total_ventas_tarjeta).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">A Crédito</div>
                    <div className="font-mono font-bold text-gray-800 mt-1">${Number(summary.total_ventas_credito).toFixed(2)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Transferencia</div>
                    <div className="font-mono font-bold text-gray-800 mt-1">${Number(summary.total_ventas_transferencia).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-xs"
          >
            [Esc] Volver a Ventas
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => alert("Imprimiendo ticket de corte...")}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-xs"
            >
              <Printer size={15} />
              <span>Imprimir Corte</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("¿Estás seguro de que deseas cerrar el turno actual?")) {
                  alert("Turno cerrado con éxito.");
                  onClose();
                }
              }}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded shadow"
            >
              <CheckCircle size={15} />
              <span>Cerrar Turno</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
