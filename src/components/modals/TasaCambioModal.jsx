import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, X, Check } from 'lucide-react';
import { posApi } from '../../services/api';

export default function TasaCambioModal({ isOpen, onClose, currentRate, onRateUpdated }) {
  const [newRate, setNewRate] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNewRate(currentRate ? currentRate.toString() : '55.00');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, currentRate]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(newRate);
    if (!parsed || parsed <= 0) {
      setError('Por favor introduce un valor de tasa válido mayor a 0.');
      return;
    }

    try {
      const res = await posApi.setExchangeRate(parsed);
      onRateUpdated(res.tasa);
      onClose();
    } catch (err) {
      setError('Error al guardar la tasa: ' + err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const rateNum = parseFloat(newRate) || 0;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-amber-300 w-full max-w-sm overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp size={18} />
            <h2 className="text-sm font-bold tracking-wide uppercase">Tasa de Cambio del Día</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Ingresa la Tasa Diaria (Bs. por 1 USD $):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 font-bold text-base">Bs.</span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                required
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Ej: 55.40"
                className="w-full pl-11 pr-3 py-2 text-2xl font-bold font-mono text-gray-900 border-2 border-amber-500 rounded focus:ring-2 focus:ring-amber-400 focus:outline-hidden text-right"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Esta tasa se aplicará de inmediato a todos los precios de venta, consultas y tickets.
            </p>
          </div>

          {/* Calculadora de vista previa rápida */}
          <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 space-y-1 text-xs">
            <div className="font-bold text-amber-900 mb-1">Equivalencias Rápidas:</div>
            <div className="flex justify-between text-gray-700">
              <span>$1.00 USD:</span>
              <span className="font-mono font-bold text-amber-950">Bs. {rateNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>$5.00 USD:</span>
              <span className="font-mono font-bold text-amber-950">Bs. {(rateNum * 5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>$10.00 USD:</span>
              <span className="font-mono font-bold text-amber-950">Bs. {(rateNum * 10).toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-xs"
            >
              [Esc] Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded shadow transition cursor-pointer"
            >
              <Check size={15} />
              <span>[ENTER] Guardar Tasa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
