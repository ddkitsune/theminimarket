import React, { useState, useEffect } from 'react';
import { ShoppingBag, FileSpreadsheet, Send, CheckSquare, Square } from 'lucide-react';
import { posApi } from '../../services/api';

export default function PurchasesScreen() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [orderCreatedMsg, setOrderCreatedMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const loadData = async () => {
    const deps = await posApi.getDepartments();
    setDepartments(deps);
    const list = await posApi.getLowStockProducts(selectedDept ? Number(selectedDept) : null);
    setSuggestedProducts(list);
    // Seleccionar todos por defecto
    setSelectedIds(new Set(list.map((p) => p.id)));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === suggestedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestedProducts.map((p) => p.id)));
    }
  };

  const toggleProduct = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreateOrder = () => {
    if (selectedIds.size === 0) {
      alert("Selecciona al menos un producto para la orden de compra.");
      return;
    }
    const count = selectedIds.size;
    setOrderCreatedMsg(`¡Orden de compra con ${count} productos generada con éxito!`);
    setTimeout(() => setOrderCreatedMsg(''), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Título y Filtros Pantalla 6 */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider">COMPRAS SUGERIDAS</h2>
      </div>

      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] p-3 text-xs space-y-2">
        <p className="text-gray-700">
          Los siguientes productos tienen bajo inventario o bien, dado su ritmo de venta están por agotarse, selecciona aquellos que desees re-ordenar:
        </p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700">Filtrar por Departamento:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-gray-800 focus:outline-hidden"
            >
              <option value="">- Todos los departamentos -</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {orderCreatedMsg && (
        <div className="bg-green-100 border-b border-green-300 px-4 py-2 text-xs font-bold text-green-900 flex items-center space-x-2">
          <span>✓</span>
          <span>{orderCreatedMsg}</span>
        </div>
      )}

      {/* Tabla de Productos Sugeridos */}
      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#baccdb] text-gray-800 font-bold sticky top-0 border-b border-[#9eb7cc]">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <button onClick={toggleSelectAll} className="cursor-pointer">
                  {selectedIds.size === suggestedProducts.length && suggestedProducts.length > 0 ? (
                    <CheckSquare size={16} className="text-blue-800" />
                  ) : (
                    <Square size={16} className="text-gray-500" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3 w-40">Código</th>
              <th className="py-2.5 px-3">Producto</th>
              <th className="py-2.5 px-3">Departamento</th>
              <th className="py-2.5 px-3 text-right w-24">Existencia</th>
              <th className="py-2.5 px-3 text-right w-24">Mínimo</th>
              <th className="py-2.5 px-3 text-right w-24">Precio Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suggestedProducts.length > 0 ? (
              suggestedProducts.map((p) => {
                const isChecked = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`cursor-pointer transition ${
                      isChecked ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded text-blue-600"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-600 font-medium">{p.codigo}</td>
                    <td className="py-2 px-3 font-bold text-gray-900">{p.producto}</td>
                    <td className="py-2 px-3 text-gray-600">{p.departamento_nombre || 'GENERAL'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                      {Number(p.existencia).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-gray-700">
                      {Number(p.inv_minimo).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                      ${Number(p.precio_costo).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-16 text-gray-400">
                  No hay productos con bajo inventario en este momento. ¡Todo en orden!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior de Acción */}
      <div className="bg-[#e4edf5] border-t border-[#c2d7eb] p-3 flex items-center justify-between">
        <div className="text-xs text-gray-600 font-semibold">
          Seleccionados: <strong className="text-blue-900 font-mono">{selectedIds.size}</strong> de {suggestedProducts.length} productos
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateOrder}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 rounded font-bold text-xs text-blue-900 shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Crear orden de compra...</span>
          </button>
          <button
            onClick={() => alert("Productos agregados a la lista de compras del proveedor.")}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow transition cursor-pointer"
          >
            <Send size={15} />
            <span>Enviar productos a lista de compra...</span>
          </button>
        </div>
      </div>
    </div>
  );
}
