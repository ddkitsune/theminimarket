import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Sliders, AlertTriangle, History, Search, CheckCircle } from 'lucide-react';
import { posApi } from '../../services/api';

export default function InventoryScreen() {
  const [activeSubTab, setActiveSubTab] = useState('agregar'); // 'agregar', 'ajustes', 'bajos', 'kardex'
  
  // Agregar Inventario Rápido
  const [code, setCode] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState('1');
  const [foundProduct, setFoundProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [kardexList, setKardexList] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeSubTab === 'kardex') {
      loadKardex();
    } else if (activeSubTab === 'bajos') {
      loadLowStock();
    } else if (activeSubTab === 'agregar') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [activeSubTab]);

  const loadKardex = async () => {
    const list = await posApi.getKardex(null, 60);
    setKardexList(list);
  };

  const loadLowStock = async () => {
    const list = await posApi.getLowStockProducts();
    setLowStockList(list);
  };

  const handleSearchCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const prod = await posApi.getProductByCode(code.trim());
    if (prod) {
      setFoundProduct(prod);
      setMessage('');
    } else {
      setFoundProduct(null);
      setMessage(`No se encontró ningún producto con el código: ${code}`);
    }
  };

  const handleApplyStock = async () => {
    if (!foundProduct) return;
    const qty = parseFloat(qtyToAdd);
    if (!qty || isNaN(qty)) {
      alert("Por favor introduce una cantidad válida.");
      return;
    }

    try {
      await posApi.addInventory({
        productoId: foundProduct.id,
        cantidad: qty,
        motivo: activeSubTab === 'agregar' ? 'Recepción de mercancía / Entrada' : 'Ajuste manual de inventario'
      });

      setMessage(`¡Stock actualizado! Nuevo stock de ${foundProduct.producto}: ${(foundProduct.existencia + qty).toFixed(2)}`);
      setFoundProduct(null);
      setCode('');
      setQtyToAdd('1');
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      alert("Error al actualizar inventario: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Sub-Pestañas Estilo eleventa Pantalla 5 */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">INVENTARIO</h2>
        </div>
      </div>

      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-4 py-1.5 flex items-center space-x-2 text-xs">
        {[
          { id: 'agregar', label: 'Agregar Inventario', icon: PlusCircle },
          { id: 'ajustes', label: 'Ajustes', icon: Sliders },
          { id: 'bajos', label: 'Productos bajos en Inventario', icon: AlertTriangle },
          { id: 'kardex', label: 'Kardex de Inventario', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-bold transition ${
                isActive
                  ? 'bg-white text-blue-900 shadow-xs border border-blue-300'
                  : 'bg-transparent text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según pestaña */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Pestaña: Agregar Inventario o Ajustes */}
        {(activeSubTab === 'agregar' || activeSubTab === 'ajustes') && (
          <div className="max-w-2xl bg-white border border-gray-200 rounded-lg shadow-xs p-6 space-y-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
              {activeSubTab === 'agregar' ? 'Agregar Existencia a Producto' : 'Ajustar Inventario'}
            </h3>

            {/* Búsqueda por código */}
            <form onSubmit={handleSearchCode} className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Código del Producto:
              </label>
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Escanea el código de barras..."
                  className="flex-1 text-sm font-mono font-bold px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition"
                >
                  Buscar
                </button>
              </div>
            </form>

            {message && (
              <div className="text-xs font-semibold p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
                {message}
              </div>
            )}

            {/* Detalle del producto seleccionado */}
            {foundProduct && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Producto:</div>
                  <div className="text-base font-bold text-gray-900">{foundProduct.producto}</div>
                  <div className="text-xs font-mono text-gray-500 mt-0.5">Código: {foundProduct.codigo}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-2.5 rounded border border-gray-200">
                    <span className="text-gray-500">Existencia Actual:</span>
                    <div className="text-xl font-bold font-mono text-gray-900 mt-1">
                      {Number(foundProduct.existencia).toFixed(2)} {foundProduct.unidad_medida}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-gray-200">
                    <span className="text-gray-500">
                      {activeSubTab === 'agregar' ? 'Cantidad a Agregar (+):' : 'Cantidad a Ajustar (+ o -):'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={qtyToAdd}
                      onChange={(e) => setQtyToAdd(e.target.value)}
                      className="w-full text-xl font-bold font-mono text-blue-900 mt-1 p-1 border border-blue-400 rounded focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleApplyStock}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
                  >
                    Guardar Nuevo Inventario
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Productos bajos en inventario */}
        {activeSubTab === 'bajos' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-amber-50/60 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertTriangle size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wide">
                  Productos donde la existencia es menor o igual al stock mínimo
                </h3>
              </div>
              <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {lowStockList.length} productos
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Departamento</th>
                  <th className="py-2.5 px-3 text-right">Existencia Actual</th>
                  <th className="py-2.5 px-3 text-right">Mínimo Requerido</th>
                  <th className="py-2.5 px-3 text-right">Precio Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockList.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/30">
                    <td className="py-2 px-3 font-mono font-medium text-gray-600">{p.codigo}</td>
                    <td className="py-2 px-3 font-bold text-gray-900">{p.producto}</td>
                    <td className="py-2 px-3 text-gray-600">{p.departamento_nombre || 'GENERAL'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                      {Number(p.existencia).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 font-semibold">
                      {Number(p.inv_minimo).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                      ${Number(p.precio_venta).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pestaña: Kardex de Inventario */}
        {activeSubTab === 'kardex' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Historial de Movimientos de Inventario (Kardex)
              </h3>
              <button
                onClick={loadKardex}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Actualizar
              </button>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Tipo Movimiento</th>
                  <th className="py-2.5 px-3 text-right">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Exist. Anterior</th>
                  <th className="py-2.5 px-3 text-right">Exist. Nueva</th>
                  <th className="py-2.5 px-3">Motivo / Folio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kardexList.length > 0 ? (
                  kardexList.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-500 font-mono">{k.created_at}</td>
                      <td className="py-2 px-3 font-mono text-gray-600">{k.codigo}</td>
                      <td className="py-2 px-3 font-medium text-gray-900 truncate max-w-xs">{k.producto}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          k.tipo === 'venta' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {k.tipo}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {k.tipo === 'venta' ? `-${k.cantidad}` : `+${k.cantidad}`}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-500">{Number(k.existencia_anterior).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-gray-800">{Number(k.existencia_nueva).toFixed(2)}</td>
                      <td className="py-2 px-3 text-gray-600">{k.motivo}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-400">
                      No hay registros recientes en el Kardex.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
