import React, { useState, useEffect, useRef } from 'react';
import { Tag, X, ShoppingCart } from 'lucide-react';
import { posApi } from '../../services/api';

export default function VerificadorModal({ isOpen, onClose, onAddProduct }) {
  const [code, setCode] = useState('');
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setProduct(null);
      setNotFound(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    const prod = await posApi.getProductByCode(code.trim());
    if (prod) {
      setProduct(prod);
      setNotFound(false);
    } else {
      setProduct(null);
      setNotFound(true);
    }
    setCode('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="kbd-chip text-blue-900 bg-white">F9</span>
            <h2 className="text-base font-bold tracking-wide">Verificador de Precios</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSearch} className="p-4 bg-gray-50 border-b border-gray-200">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Escanea o ingresa el código del producto:
          </label>
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Escanea el código de barras..."
              className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700 transition"
            >
              Consultar
            </button>
          </div>
        </form>

        {/* Display del Precio */}
        <div className="p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
          {product ? (
            <div className="space-y-3 w-full">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {product.departamento_nombre || 'GENERAL'}
              </span>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {product.producto}
              </h3>
              <div className="text-5xl font-black text-blue-700 font-mono tracking-tight py-2">
                ${Number(product.precio_venta).toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">
                Existencia en tienda: <strong className="text-gray-900 font-mono">{Number(product.existencia).toFixed(2)}</strong> {product.unidad_medida}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onAddProduct(product);
                    onClose();
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded shadow transition"
                >
                  <ShoppingCart size={15} />
                  <span>Agregar este producto a la venta</span>
                </button>
              </div>
            </div>
          ) : notFound ? (
            <div className="text-red-500 font-bold text-sm">
              Código no registrado en el inventario.
            </div>
          ) : (
            <div className="text-gray-400 text-sm flex flex-col items-center">
              <Tag size={40} className="mb-2 text-gray-300" />
              <span>Pasa un producto por el lector para ver su precio y existencia.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-xs transition"
          >
            [Esc] Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
