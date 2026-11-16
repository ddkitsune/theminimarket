import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderPlus, Save, X, Search, CheckCircle } from 'lucide-react';
import { posApi } from '../../services/api';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [message, setMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    codigo: '',
    producto: '',
    tipo_venta: 'unidad',
    precio_costo: 0,
    ganancia_porcentaje: 20,
    precio_venta: 0,
    precio_mayoreo: 0,
    departamento_id: '',
    unidad_medida: 'PZA',
    usa_inventario: 1,
    existencia: 0,
    inv_minimo: 0,
    inv_maximo: 0
  });

  useEffect(() => {
    loadDepartments();
    loadProducts();
  }, []);

  const loadDepartments = async () => {
    const deps = await posApi.getDepartments();
    setDepartments(deps);
  };

  const loadProducts = async () => {
    const list = await posApi.searchProducts('', 100);
    setProducts(list);
  };

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.producto.toLowerCase().includes(searchQuery.toLowerCase()) || p.codigo.includes(searchQuery);
    const matchesDept = !selectedDeptFilter || String(p.departamento_id) === String(selectedDeptFilter);
    return matchesSearch && matchesDept;
  });

  // Calcular precio venta a partir de ganancia
  const handleCostChange = (costVal) => {
    const cost = parseFloat(costVal) || 0;
    const margin = parseFloat(formData.ganancia_porcentaje) || 0;
    const sale = cost + (cost * (margin / 100));
    setFormData((prev) => ({
      ...prev,
      precio_costo: cost,
      precio_venta: parseFloat(sale.toFixed(2))
    }));
  };

  const handleMarginChange = (marginVal) => {
    const margin = parseFloat(marginVal) || 0;
    const cost = parseFloat(formData.precio_costo) || 0;
    const sale = cost + (cost * (margin / 100));
    setFormData((prev) => ({
      ...prev,
      ganancia_porcentaje: margin,
      precio_venta: parseFloat(sale.toFixed(2))
    }));
  };

  const handleSalePriceChange = (saleVal) => {
    const sale = parseFloat(saleVal) || 0;
    const cost = parseFloat(formData.precio_costo) || 0;
    let margin = 0;
    if (cost > 0 && sale > cost) {
      margin = ((sale - cost) / cost) * 100;
    }
    setFormData((prev) => ({
      ...prev,
      precio_venta: sale,
      ganancia_porcentaje: parseFloat(margin.toFixed(2))
    }));
  };

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setFormData({
      id: p.id,
      codigo: p.codigo,
      producto: p.producto,
      tipo_venta: p.tipo_venta || 'unidad',
      precio_costo: p.precio_costo,
      ganancia_porcentaje: p.ganancia_porcentaje || 0,
      precio_venta: p.precio_venta,
      precio_mayoreo: p.precio_mayoreo || 0,
      departamento_id: p.departamento_id || '',
      unidad_medida: p.unidad_medida || 'PZA',
      usa_inventario: p.usa_inventario !== undefined ? p.usa_inventario : 1,
      existencia: p.existencia,
      inv_minimo: p.inv_minimo || 0,
      inv_maximo: p.inv_maximo || 0
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setSelectedProduct(null);
    setFormData({
      id: null,
      codigo: '',
      producto: '',
      tipo_venta: 'unidad',
      precio_costo: 0,
      ganancia_porcentaje: 25,
      precio_venta: 0,
      precio_mayoreo: 0,
      departamento_id: departments[0]?.id || '',
      unidad_medida: 'PZA',
      usa_inventario: 1,
      existencia: 0,
      inv_minimo: 2,
      inv_maximo: 20
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.producto.trim()) {
      alert('Código y descripción son obligatorios.');
      return;
    }

    try {
      await posApi.saveProduct({
        ...formData,
        departamento_id: formData.departamento_id ? Number(formData.departamento_id) : null
      });
      setMessage('¡Producto guardado exitosamente!');
      setTimeout(() => setMessage(''), 3000);
      loadProducts();
      setIsEditing(false);
    } catch (err) {
      alert('Error al guardar producto: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (window.confirm(`¿Estás seguro de eliminar el producto "${formData.producto}"?`)) {
      await posApi.deleteProduct(formData.id);
      loadProducts();
      handleNew();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Herramientas Estilo eleventa */}
      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleNew}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-[#b4cbe0] rounded text-blue-900 font-bold shadow-2xs transition"
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
          </button>
          {isEditing && formData.id && (
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-[#b4cbe0] rounded text-red-700 font-bold shadow-2xs transition"
            >
              <Trash2 size={15} />
              <span>Eliminar</span>
            </button>
          )}
        </div>

        {message && (
          <div className="flex items-center space-x-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
            <CheckCircle size={15} />
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lado Izquierdo: Lista de Productos y Filtro */}
        <div className="w-80 md:w-96 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-200 space-y-2 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full py-1 px-2 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-medium text-gray-700"
            >
              <option value="">Todos los Departamentos ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`p-2.5 text-xs cursor-pointer transition ${
                    isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900 truncate">{p.producto}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                    <span className="font-mono text-gray-600">{p.codigo}</span>
                    <span className="font-bold text-blue-700 font-mono">${Number(p.precio_venta).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Formulario Estilo eleventa Pantalla 4 */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form onSubmit={handleSave} className="max-w-2xl space-y-5">
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                {formData.id ? 'Modificar Producto' : 'Nuevo Producto'}
              </h2>
              {formData.id && (
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                  ID: #{formData.id}
                </span>
              )}
            </div>

            {/* Código de Barras y Descripción */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Código de Barras:
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Escanea o escribe el código..."
                  className="w-full text-sm font-mono font-bold px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Descripción del Producto:
                </label>
                <input
                  type="text"
                  required
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: e.target.value.toUpperCase() })}
                  placeholder="Ej: ACEITE MAZEITE 1 LITRO"
                  className="w-full text-sm font-bold px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Se vende: Por Unidad, A Granel, Como paquete */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Se vende:
              </label>
              <div className="flex items-center space-x-6 text-xs font-medium text-gray-800">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_venta"
                    value="unidad"
                    checked={formData.tipo_venta === 'unidad'}
                    onChange={() => setFormData({ ...formData, tipo_venta: 'unidad', unidad_medida: 'PZA' })}
                    className="text-blue-600"
                  />
                  <span>Por Unidad / Pza</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_venta"
                    value="granel"
                    checked={formData.tipo_venta === 'granel'}
                    onChange={() => setFormData({ ...formData, tipo_venta: 'granel', unidad_medida: 'KG' })}
                    className="text-blue-600"
                  />
                  <span>A Granel (Usa Decimales / Báscula)</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_venta"
                    value="kit"
                    checked={formData.tipo_venta === 'kit'}
                    onChange={() => setFormData({ ...formData, tipo_venta: 'kit' })}
                    className="text-blue-600"
                  />
                  <span>Como paquete (Kit)</span>
                </label>
              </div>
            </div>

            {/* Precios y Ganancia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Precio Costo ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_costo}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className="w-full text-sm font-bold font-mono px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Ganancia (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ganancia_porcentaje}
                  onChange={(e) => handleMarginChange(e.target.value)}
                  className="w-full text-sm font-bold font-mono px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-900 uppercase mb-1">
                  Precio Venta ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => handleSalePriceChange(e.target.value)}
                  className="w-full text-sm font-bold font-mono px-2.5 py-1.5 bg-blue-100/60 border-2 border-blue-500 rounded text-right focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Precio Mayoreo ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_mayoreo}
                  onChange={(e) => setFormData({ ...formData, precio_mayoreo: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm font-bold font-mono px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Departamento y Unidad de Medida */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Departamento:
                </label>
                <select
                  value={formData.departamento_id}
                  onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">- Sin Departamento -</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Unidad de Medida:
                </label>
                <input
                  type="text"
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value.toUpperCase() })}
                  placeholder="PZA, KG, LT..."
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Control de Inventario */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(formData.usa_inventario)}
                  onChange={(e) => setFormData({ ...formData, usa_inventario: e.target.checked ? 1 : 0 })}
                  className="rounded text-blue-600"
                />
                <span>Este producto SÍ utiliza inventario</span>
              </label>

              {Boolean(formData.usa_inventario) && (
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">Hay en este momento:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.existencia}
                      onChange={(e) => setFormData({ ...formData, existencia: parseFloat(e.target.value) || 0 })}
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-600 mb-1">Mínimo (Alerta):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.inv_minimo}
                      onChange={(e) => setFormData({ ...formData, inv_minimo: parseFloat(e.target.value) || 0 })}
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-600 mb-1">Máximo:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.inv_maximo}
                      onChange={(e) => setFormData({ ...formData, inv_maximo: parseFloat(e.target.value) || 0 })}
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-white border border-gray-300 rounded text-right"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded shadow transition cursor-pointer"
              >
                <Save size={15} />
                <span>Guardar Producto</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
