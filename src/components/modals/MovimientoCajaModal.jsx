import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { posApi } from '../../services/api';

export default function MovimientoCajaModal({ isOpen, onClose, tipo = 'entrada', turnoId, onSaved }) {
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const esEntrada = tipo === 'entrada';

  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setMotivo('');
      setError('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (!val || val <= 0) {
      setError('Por favor introduce un monto válido.');
      return;
    }
    if (!motivo.trim()) {
      setError('Por favor indica el motivo del movimiento.');
      return;
    }

    try {
      await posApi.addCashMovement({
        turnoId,
        tipo,
        monto: val,
        motivo: motivo.trim()
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError('Error al registrar movimiento: ' + err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className={`text-white px-5 py-3 flex items-center justify-between ${
          esEntrada ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="kbd-chip text-gray-900 bg-white">
              {esEntrada ? 'F7' : 'F8'}
            </span>
            <h2 className="text-base font-bold tracking-wide">
              {esEntrada ? 'Entrada de Efectivo' : 'Salida de Efectivo'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Cantidad ($):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 font-bold">$</span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-xl font-bold font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Motivo o Concepto:
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={esEntrada ? 'Ej: Fondo extra, cambio de billetes...' : 'Ej: Pago a repartidor, compra de insumos...'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-xs"
            >
              [Esc] Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded shadow transition ${
                esEntrada ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              [ENTER] Guardar {esEntrada ? 'Entrada' : 'Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
