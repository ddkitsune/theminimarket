import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, 
  Search, 
  Tag, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2, 
  Plus, 
  DollarSign, 
  User, 
  RotateCcw,
  Printer,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { posApi } from '../services/api';

export default function SalesScreen({
  onOpenCobrar,
  onOpenBuscar,
  onOpenVerificador,
  onOpenEntrada,
  onOpenSalida,
  tickets,
  setTickets,
  activeTicketIndex,
  setActiveTicketIndex,
  exchangeRate = 55.0,
  onReprintLastTicket
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const barcodeInputRef = useRef(null);

  const currentTicket = tickets[activeTicketIndex] || { id: 1, name: 'Ticket 1', items: [], cliente: null };

  // Mantener foco en el input del código de barras
  useEffect(() => {
    focusBarcode();
  }, [activeTicketIndex]);

  const focusBarcode = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Calcular totales del ticket activo
  const totalArticulos = currentTicket.items.reduce((acc, it) => acc + it.cantidad, 0);
  const totalVentaUsd = currentTicket.items.reduce((acc, it) => acc + (it.precio * it.cantidad), 0);
  const totalVentaBs = totalVentaUsd * exchangeRate;

  // Agregar producto al ticket actual
  const addProductToCurrentTicket = (prod, qty = 1) => {
    setTickets((prevTickets) => {
      const updated = [...prevTickets];
      const cur = { ...updated[activeTicketIndex] };
      const existingIdx = cur.items.findIndex((it) => it.id === prod.id);

      if (existingIdx >= 0) {
        const item = { ...cur.items[existingIdx] };
        item.cantidad += qty;
        cur.items[existingIdx] = item;
        setSelectedRowIndex(existingIdx);
      } else {
        const newItem = {
          id: prod.id,
          codigo: prod.codigo,
          producto: prod.producto,
          precio_costo: prod.precio_costo,
          precio: prod.precio_venta,
          precio_mayoreo: prod.precio_mayoreo,
          cantidad: qty,
          existencia: prod.existencia,
          tipo_venta: prod.tipo_venta
        };
        cur.items = [...cur.items, newItem];
        setSelectedRowIndex(cur.items.length - 1);
      }

      updated[activeTicketIndex] = cur;
      return updated;
    });

    const bsEquiv = (prod.precio_venta * exchangeRate).toFixed(2);
    setStatusMessage(`Agregado: ${prod.producto} ($${prod.precio_venta} / Bs. ${bsEquiv})`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Manejar el submit del input de código de barras
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let qty = 1;
    let codeToSearch = raw;

    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        codeToSearch = parts.slice(1).join('*').trim();
      }
    }

    const prod = await posApi.getProductByCode(codeToSearch);
    if (prod) {
      addProductToCurrentTicket(prod, qty);
      setBarcodeInput('');
    } else {
      setStatusMessage(`Producto con código "${codeToSearch}" no encontrado.`);
    }
  };

  // Borrar el artículo seleccionado
  const handleDeleteSelectedItem = () => {
    if (currentTicket.items.length === 0) return;
    setTickets((prev) => {
      const updated = [...prev];
      const cur = { ...updated[activeTicketIndex] };
      cur.items = cur.items.filter((_, idx) => idx !== selectedRowIndex);
      updated[activeTicketIndex] = cur;
      return updated;
    });
    setSelectedRowIndex((prev) => Math.max(0, prev - 1));
  };

  // Cambiar cantidad del seleccionado (F5)
  const handleChangeQuantity = () => {
    if (currentTicket.items.length === 0) return;
    const item = currentTicket.items[selectedRowIndex];
    const nueva = prompt(`Ingresa la nueva cantidad para "${item.producto}":`, item.cantidad);
    if (nueva !== null) {
      const parsed = parseFloat(nueva);
      if (!isNaN(parsed) && parsed > 0) {
        setTickets((prev) => {
          const updated = [...prev];
          const cur = { ...updated[activeTicketIndex] };
          cur.items[selectedRowIndex].cantidad = parsed;
          updated[activeTicketIndex] = cur;
          return updated;
        });
      }
    }
  };

  // Crear nuevo ticket
  const handleNewTicket = () => {
    const nextNum = tickets.length + 1;
    setTickets((prev) => [
      ...prev,
      { id: Date.now(), name: `Ticket ${nextNum}`, items: [], cliente: null }
    ]);
    setActiveTicketIndex(tickets.length);
  };

  // Cerrar ticket
  const handleCloseTicket = (idx, e) => {
    e.stopPropagation();
    if (tickets.length === 1) {
      setTickets([{ id: 1, name: 'Ticket 1', items: [], cliente: null }]);
      return;
    }
    setTickets((prev) => prev.filter((_, i) => i !== idx));
    setActiveTicketIndex((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* 1. Barra de Código de Producto */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-3 w-full max-w-3xl">
          <label className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            Código del Producto:
          </label>
          <div className="relative flex-1">
            <Barcode className="absolute left-2.5 top-2 text-gray-500" size={17} />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanea el código de barras o escribe ej: 3*codigo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold bg-white text-gray-900 rounded border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-300"
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1b3b5a] hover:bg-[#142c44] text-xs font-bold rounded border border-[#406e9c] transition shadow-xs cursor-pointer"
          >
            <span className="kbd-chip bg-white text-blue-900 text-[10px]">ENTER</span>
            <span>Agregar</span>
          </button>
        </form>

        <div className="text-xs font-bold text-cyan-200">
          VENTA - {currentTicket.name}
        </div>
      </div>

      {/* 2. Barra de Botones de Función Rápida */}
      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-3 py-1.5 flex flex-wrap gap-1.5 items-center text-xs">
        <button 
          onClick={() => {
            const desc = prompt("Descripción del artículo común:");
            const precio = prompt("Precio de venta ($ USD):");
            if (desc && precio) {
              addProductToCurrentTicket({
                id: 'comun_' + Date.now(),
                codigo: 'GENERICO',
                producto: desc.toUpperCase(),
                precio_costo: parseFloat(precio) * 0.7,
                precio_venta: parseFloat(precio),
                existencia: 999,
                tipo_venta: 'unidad'
              });
            }
          }}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-[#b4cbe0] rounded text-gray-800 font-semibold shadow-2xs transition cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">INS</span>
          <span>Varios</span>
        </button>

        <button 
          onClick={onOpenBuscar}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-[#b4cbe0] rounded text-gray-800 font-semibold shadow-2xs transition cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">F10</span>
          <span>Buscar</span>
        </button>

        <button 
          onClick={onOpenVerificador}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-[#b4cbe0] rounded text-gray-800 font-semibold shadow-2xs transition cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">F9</span>
          <span>Verificador</span>
        </button>

        <button 
          onClick={onOpenEntrada}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-[#b4cbe0] rounded text-emerald-800 font-semibold shadow-2xs transition cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">F7</span>
          <span>Entradas</span>
        </button>

        <button 
          onClick={onOpenSalida}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-rose-50 border border-[#b4cbe0] rounded text-rose-800 font-semibold shadow-2xs transition cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">F8</span>
          <span>Salidas</span>
        </button>

        <button 
          onClick={handleDeleteSelectedItem}
          disabled={currentTicket.items.length === 0}
          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-red-50 border border-[#b4cbe0] rounded text-red-700 font-semibold shadow-2xs transition disabled:opacity-40 cursor-pointer"
        >
          <span className="kbd-chip text-[10px]">DEL</span>
          <span>Borrar Art.</span>
        </button>

        {statusMessage && (
          <div className="ml-auto text-xs font-bold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded border border-blue-200">
            {statusMessage}
          </div>
        )}
      </div>

      {/* 3. Pestañas de Multi-Ticket */}
      <div className="flex items-center px-3 pt-2 bg-[#d7e4f0] border-b border-[#b7cde1] space-x-1">
        {tickets.map((t, idx) => {
          const isActive = idx === activeTicketIndex;
          return (
            <div
              key={t.id}
              onClick={() => setActiveTicketIndex(idx)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-t border-t border-l border-r cursor-pointer transition ${
                isActive
                  ? 'bg-white text-blue-900 border-[#94b3cf] shadow-xs'
                  : 'bg-[#cad9e8] text-gray-600 hover:bg-[#bccfe0] border-transparent'
              }`}
            >
              <span>{t.name}</span>
              {t.items.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
                  {t.items.length}
                </span>
              )}
              {tickets.length > 1 && (
                <button
                  onClick={(e) => handleCloseTicket(idx, e)}
                  className="text-gray-400 hover:text-red-600 ml-1 rounded"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleNewTicket}
          title="Abrir nuevo ticket de venta"
          className="px-2 py-1 text-xs font-bold text-blue-800 hover:bg-blue-200 rounded transition cursor-pointer"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* 4. Tabla de Artículos del Ticket (Bimoneda: $ USD y Bs.) */}
      <div className="flex-1 overflow-y-auto bg-white border-b border-gray-300">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#baccdb] text-gray-800 font-bold sticky top-0 border-b border-[#9eb7cc]">
            <tr>
              <th className="py-2 px-3 w-40">Código</th>
              <th className="py-2 px-3">Descripción del Producto</th>
              <th className="py-2 px-3 text-right w-36">Precio ($ / Bs.)</th>
              <th className="py-2 px-3 text-center w-20">Cant.</th>
              <th className="py-2 px-3 text-right w-36">Importe ($ / Bs.)</th>
              <th className="py-2 px-3 text-right w-24">Existencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentTicket.items.length > 0 ? (
              currentTicket.items.map((item, idx) => {
                const isSelected = idx === selectedRowIndex;
                const importeUsd = item.precio * item.cantidad;
                const importeBs = importeUsd * exchangeRate;
                const unitBs = item.precio * exchangeRate;

                return (
                  <tr
                    key={item.id + '_' + idx}
                    onClick={() => setSelectedRowIndex(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-blue-50/70 text-gray-800'
                        : 'bg-[#f9fbfd] hover:bg-blue-50/70 text-gray-800'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono">{item.codigo}</td>
                    <td className="py-2 px-3 truncate max-w-md">{item.producto}</td>
                    
                    {/* Precio Unitario Dual */}
                    <td className="py-2 px-3 text-right font-mono">
                      <div>${Number(item.precio).toFixed(2)}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        Bs. {unitBs.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center font-mono font-bold text-sm">{item.cantidad}</td>
                    
                    {/* Importe Dual */}
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      <div className="text-sm">${importeUsd.toFixed(2)}</div>
                      <div className={`text-[11px] font-normal ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                        Bs. {importeBs.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right font-mono">{Number(item.existencia).toFixed(2)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-20 text-center text-gray-400">
                  <Barcode size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-500">No hay productos en esta venta.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Escanea un código de barras o presiona <strong className="text-blue-600">[F10]</strong> para buscar en el catálogo.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Barra Inferior de Totales y Cobro (F12) */}
      <div className="bg-[#e4edf5] border-t border-[#b7cde1] p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Controles de fila y cliente */}
        <div className="flex flex-col space-y-1.5">
          <div className="text-xs font-bold text-gray-700">
            <span className="text-blue-800 font-mono text-sm">{totalArticulos}</span> Productos en la venta actual.
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={handleChangeQuantity}
              disabled={currentTicket.items.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded font-semibold text-gray-800 shadow-2xs transition disabled:opacity-40 cursor-pointer"
            >
              F5 - Cambiar Cant.
            </button>
            <button
              onClick={handleDeleteSelectedItem}
              disabled={currentTicket.items.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-red-50 border border-gray-300 rounded font-semibold text-red-700 shadow-2xs transition disabled:opacity-40 cursor-pointer"
            >
              Eliminar
            </button>
            <button
              onClick={onReprintLastTicket}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 rounded font-semibold text-blue-900 shadow-2xs transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Reimprimir Último Ticket</span>
            </button>
          </div>
        </div>

        {/* Botón Cobrar y Pantallas Gigantes Bimoneda */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCobrar}
            disabled={currentTicket.items.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-sm rounded shadow-md transition cursor-pointer disabled:cursor-not-allowed"
          >
            <DollarSign size={20} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-emerald-100">Presiona F12</div>
              <div>F12 - Cobrar</div>
            </div>
          </button>

          {/* Pantalla Total Dual Gigante ($ USD y Bs.) */}
          <div className="bg-white border-2 border-blue-400 rounded-lg px-6 py-2 text-right min-w-[240px] shadow-inner">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total a Pagar</div>
            {/* Total USD */}
            <div className="text-3xl font-black text-blue-900 font-mono tracking-tight leading-none mt-0.5">
              ${totalVentaUsd.toFixed(2)} <span className="text-xs font-bold text-blue-600">USD</span>
            </div>
            {/* Total Bs. */}
            <div className="text-base font-black text-emerald-700 font-mono tracking-tight mt-1 border-t border-gray-100 pt-0.5">
              Bs. {totalVentaBs.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
