import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, CreditCard, UserCheck, Smartphone, Landmark, Printer, X, Check } from 'lucide-react';

export default function CobrarModal({ 
  isOpen, 
  onClose, 
  totalUsd, 
  exchangeRate = 55.0, 
  onConfirmSale, 
  clienteSeleccionado 
}) {
  const [metodo, setMetodo] = useState('usd_efectivo'); // 'usd_efectivo', 'bs_efectivo', 'punto_venta', 'pago_movil', 'credito', 'transferencia'
  const [pagoCon, setPagoCon] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const totalBs = totalUsd * exchangeRate;
  const isPayingInBs = ['bs_efectivo', 'punto_venta', 'pago_movil'].includes(metodo);

  useEffect(() => {
    if (isOpen) {
      if (isPayingInBs) {
        setPagoCon(totalBs.toFixed(2));
      } else {
        setPagoCon(totalUsd.toFixed(2));
      }
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, totalUsd, metodo, exchangeRate]);

  if (!isOpen) return null;

  const pagoNum = parseFloat(pagoCon) || 0;

  // Cálculos de cambio bimoneda
  let cambioUsd = 0;
  let cambioBs = 0;
  let faltanteUsd = 0;
  let faltanteBs = 0;

  if (isPayingInBs) {
    cambioBs = Math.max(0, pagoNum - totalBs);
    cambioUsd = cambioBs / exchangeRate;
    faltanteBs = Math.max(0, totalBs - pagoNum);
    faltanteUsd = faltanteBs / exchangeRate;
  } else {
    cambioUsd = Math.max(0, pagoNum - totalUsd);
    cambioBs = cambioUsd * exchangeRate;
    faltanteUsd = Math.max(0, totalUsd - pagoNum);
    faltanteBs = faltanteUsd * exchangeRate;
  }

  const handleCobrar = () => {
    if (isPayingInBs && pagoNum < totalBs) {
      setError(`Monto insuficiente. Faltan Bs. ${faltanteBs.toFixed(2)} ($${faltanteUsd.toFixed(2)} USD)`);
      return;
    }
    if (!isPayingInBs && metodo === 'usd_efectivo' && pagoNum < totalUsd) {
      setError(`Monto insuficiente. Faltan $${faltanteUsd.toFixed(2)} USD (Bs. ${faltanteBs.toFixed(2)})`);
      return;
    }
    if (metodo === 'credito' && !clienteSeleccionado) {
      setError('Debes asignar un cliente con crédito autorizado para cobrar a crédito.');
      return;
    }

    onConfirmSale({
      metodoPago: metodo,
      pagoCon: isPayingInBs ? (pagoNum / exchangeRate) : pagoNum,
      cambio: cambioUsd,
      tasaCambio: exchangeRate
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCobrar();
    }
  };

  const billetesUsd = [5, 10, 20, 50, 100];

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="kbd-chip text-blue-900 bg-white">F12</span>
            <h2 className="text-base font-bold tracking-wide">Cobrar Venta Bimoneda</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Métodos de Pago Adaptados a Minimarkets */}
        <div className="grid grid-cols-3 gap-1.5 p-3 bg-gray-50 border-b border-gray-200 text-xs">
          {[
            { id: 'usd_efectivo', label: 'Efectivo $ USD', icon: DollarSign },
            { id: 'pago_movil', label: 'Pago Móvil (Bs.)', icon: Smartphone },
            { id: 'punto_venta', label: 'Punto / Tarjeta (Bs.)', icon: CreditCard },
            { id: 'bs_efectivo', label: 'Efectivo Bs.', icon: Landmark },
            { id: 'credito', label: 'A Crédito / Fiado', icon: UserCheck },
            { id: 'transferencia', label: 'Transferencia', icon: Check }
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = metodo === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMetodo(m.id)}
                className={`flex items-center justify-center space-x-1.5 py-2 px-1 rounded border transition font-bold cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon size={14} />
                <span className="text-[11px] truncate">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pantalla de Totales Bimoneda */}
        <div className="p-5 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-center">
            <div className="border-r border-blue-200 pr-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Total en Dólares ($)</div>
              <div className="text-2xl font-black text-blue-900 font-mono">
                ${totalUsd.toFixed(2)}
              </div>
            </div>
            <div className="pl-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Total en Bolívares (Bs.)</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                Bs. {totalBs.toFixed(2)}
              </div>
            </div>
            <div className="col-span-2 pt-1 border-t border-blue-100 text-[11px] text-gray-500 font-medium">
              Tasa aplicada: <strong className="text-gray-800 font-mono">Bs. {exchangeRate.toFixed(2)} / $</strong>
            </div>
          </div>

          {/* Input de Pago */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Pagó con ({isPayingInBs ? 'Bolívares Bs.' : 'Dólares $ USD'}):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 font-bold text-base">
                {isPayingInBs ? 'Bs.' : '$'}
              </span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={pagoCon}
                onChange={(e) => setPagoCon(e.target.value)}
                className="w-full pl-10 pr-3 text-2xl font-mono font-bold text-gray-900 bg-white border-2 border-blue-500 rounded-md py-1.5 text-right focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                placeholder="0.00"
              />
            </div>

            {/* Botones sugeridos */}
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                type="button"
                onClick={() => setPagoCon((isPayingInBs ? totalBs : totalUsd).toFixed(2))}
                className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition cursor-pointer"
              >
                Exacto ({isPayingInBs ? `Bs. ${totalBs.toFixed(2)}` : `$${totalUsd.toFixed(2)}`})
              </button>

              {!isPayingInBs && billetesUsd
                .filter((b) => b >= totalUsd)
                .slice(0, 4)
                .map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setPagoCon(b.toFixed(2))}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-200 hover:bg-blue-100 text-gray-800 hover:text-blue-800 rounded transition cursor-pointer"
                  >
                    ${b}
                  </button>
                ))}
            </div>
          </div>

          {/* Display de Cambio Bimoneda */}
          {(cambioUsd > 0 || cambioBs > 0) && (
            <div className="border border-green-200 bg-green-50/70 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-green-900 uppercase">Su Cambio:</div>
                <div className="text-[11px] text-green-700">Entregar al cliente</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-2xl font-black text-green-800">
                  ${cambioUsd.toFixed(2)} <span className="text-xs font-normal">USD</span>
                </div>
                <div className="text-xs font-bold text-green-700">
                  (ó Bs. {cambioBs.toFixed(2)})
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Crédito */}
          {metodo === 'credito' && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800">
              <span className="font-bold">Aviso Crédito:</span>{' '}
              {clienteSeleccionado 
                ? `Se cargará a la cuenta de ${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`
                : 'No hay cliente asignado al ticket. Debes asignar un cliente primero.'}
            </div>
          )}

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Botones inferiores */}
        <div className="bg-gray-100 px-5 py-3 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-xs transition cursor-pointer"
          >
            [Esc] Cancelar
          </button>
          <button
            onClick={handleCobrar}
            className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded shadow transition cursor-pointer"
          >
            <Printer size={15} />
            <span>[ENTER] Cobrar e Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
