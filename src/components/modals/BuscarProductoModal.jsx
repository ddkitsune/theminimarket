import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { posApi } from '../../services/api';

export default function BuscarProductoModal({ isOpen, onClose, onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      loadInitialProducts();
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const loadInitialProducts = async () => {
    setLoading(true);
    try {
      const prods = await posApi.searchProducts('', 30);
      setResults(prods || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const prods = await posApi.searchProducts(query, 50);
        setResults(prods || []);
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectProduct(results[selectedIndex]);
        onClose();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 w-full max-w-3xl h-[520px] flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="kbd-chip text-blue-900 bg-white">F10</span>
            <h2 className="text-base font-bold tracking-wide">Buscar Producto</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe el nombre del producto o código de barras..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded shadow-inner text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#e9f2fa] text-gray-700 sticky top-0 border-b border-[#c2d7eb] font-bold">
              <tr>
                <th className="py-2 px-3">Código</th>
                <th className="py-2 px-3">Descripción</th>
                <th className="py-2 px-3">Departamento</th>
                <th className="py-2 px-3 text-right">Existencia</th>
                <th className="py-2 px-3 text-right">Precio Venta</th>
                <th className="py-2 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length > 0 ? (
                results.map((p, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-semibold' 
                          : 'hover:bg-blue-50 text-gray-800'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono">{p.codigo}</td>
                      <td className="py-2 px-3 truncate max-w-xs">{p.producto}</td>
                      <td className="py-2 px-3">{p.departamento_nombre || 'GENERAL'}</td>
                      <td className="py-2 px-3 text-right font-mono">{Number(p.existencia).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        ${Number(p.precio_venta).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isSelected ? <Check size={14} className="mx-auto" /> : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    {loading ? 'Buscando en catálogo...' : 'No se encontraron productos con ese criterio.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra inferior */}
        <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div>
            Usa <span className="kbd-chip">↑</span> <span className="kbd-chip">↓</span> para navegar y <span className="kbd-chip">ENTER</span> para seleccionar
          </div>
          <div>
            Total encontrados: <span className="font-bold text-gray-900">{results.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
