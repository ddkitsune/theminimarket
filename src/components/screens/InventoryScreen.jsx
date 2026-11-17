import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Sliders, 
  AlertTriangle, 
  History, 
  Search, 
  CheckCircle, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Package, 
  RefreshCw,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { posApi } from '../../services/api';

export default function InventoryScreen() {
  const [activeSubTab, setActiveSubTab] = useState('agregar'); // 'agregar', 'ajustes', 'todos', 'bajos', 'kardex', 'importar_exportar'
  
  // Agregar / Ajustar Inventario
  const [codeOrName, setCodeOrName] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState('1');
  const [foundProduct, setFoundProduct] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  
  // Listas
  const [kardexList, setKardexList] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [generalSearch, setGeneralSearch] = useState('');
  const [filterDepto, setFilterDepto] = useState('TODOS');
  const [departments, setDepartments] = useState([]);

  // Importar / Exportar
  const [importPreview, setImportPreview] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadDepartments();
    if (activeSubTab === 'kardex') {
      loadKardex();
    } else if (activeSubTab === 'bajos') {
      loadLowStock();
    } else if (activeSubTab === 'todos') {
      loadAllProducts();
    } else if (activeSubTab === 'agregar' || activeSubTab === 'ajustes') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [activeSubTab]);

  const loadDepartments = async () => {
    try {
      const deptos = await posApi.getDepartments();
      setDepartments(deptos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadKardex = async () => {
    const list = await posApi.getKardex(null, 80);
    setKardexList(list || []);
  };

  const loadLowStock = async () => {
    const list = await posApi.getLowStockProducts();
    setLowStockList(list || []);
  };

  const loadAllProducts = async (term = '') => {
    try {
      const list = await posApi.searchProducts(term, 150);
      setAllProducts(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Búsqueda en tiempo real por nombre o código en Agregar / Ajustar
  const handleInputChange = async (val) => {
    setCodeOrName(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Si parece código numérico exacto, intentar buscar por código primero
      const exact = await posApi.getProductByCode(val.trim());
      if (exact) {
        setSearchResults([exact]);
      } else {
        const matches = await posApi.searchProducts(val.trim(), 10);
        setSearchResults(matches || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectProduct = (prod) => {
    setFoundProduct(prod);
    setCodeOrName(prod.producto);
    setSearchResults([]);
    setIsSearching(false);
    setMessage('');
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
      setCodeOrName('');
      setQtyToAdd('1');
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      alert("Error al actualizar inventario: " + err.message);
    }
  };

  // EXPORTAR A EXCEL (.xlsx)
  const handleExportExcel = async () => {
    try {
      const data = await posApi.exportProducts();
      if (!data || data.length === 0) {
        alert("No hay productos para exportar.");
        return;
      }

      // Crear hoja de cálculo con SheetJS
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const fileName = `Inventario_MiniMarket_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (err) {
      alert("Error al exportar inventario: " + err.message);
    }
  };

  // EXPORTAR A CSV
  const handleExportCsv = async () => {
    try {
      const data = await posApi.exportProducts();
      if (!data || data.length === 0) return;

      const ws = XLSX.utils.json_to_sheet(data);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Inventario_MiniMarket_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Error al exportar CSV: " + err.message);
    }
  };

  // IMPORTAR ARCHIVO EXCEL / CSV
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Leyendo archivo...');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          alert("El archivo está vacío o no contiene filas con datos.");
          setImportStatus('');
          return;
        }

        setImportPreview({
          fileName: file.name,
          totalRows: data.length,
          previewRows: data.slice(0, 5),
          allData: data
        });
        setImportStatus(`Archivo cargado: ${data.length} productos detectados listos para importar.`);
      } catch (err) {
        alert("Error al leer el archivo Excel: " + err.message);
        setImportStatus('');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    if (!importPreview || !importPreview.allData) return;
    setIsImporting(true);
    setImportStatus('Importando productos a la base de datos...');

    try {
      const res = await posApi.importProducts(importPreview.allData);
      setImportStatus(`¡Importación completada con éxito! Se procesaron ${res.total} productos (${res.inserted} nuevos agregados, ${res.updated} actualizados).`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert("Error en la importación: " + err.message);
      setImportStatus('Error en la importación: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Filtrado de la pestaña Todos
  const filteredProducts = allProducts.filter(p => {
    const matchQuery = !generalSearch || 
      p.producto.toLowerCase().includes(generalSearch.toLowerCase()) || 
      p.codigo.toLowerCase().includes(generalSearch.toLowerCase());
    const matchDepto = filterDepto === 'TODOS' || (p.departamento_nombre || '').toUpperCase() === filterDepto;
    return matchQuery && matchDepto;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Sub-Pestañas Estilo eleventa */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">INVENTARIO</h2>
        </div>
      </div>

      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-4 py-1.5 flex items-center space-x-2 text-xs overflow-x-auto">
        {[
          { id: 'agregar', label: 'Agregar Inventario', icon: PlusCircle },
          { id: 'ajustes', label: 'Ajustes', icon: Sliders },
          { id: 'todos', label: 'Buscar & Ver Todo', icon: Package },
          { id: 'bajos', label: 'Bajos en Inventario', icon: AlertTriangle },
          { id: 'kardex', label: 'Kardex de Movimientos', icon: History },
          { id: 'importar_exportar', label: 'Importar / Exportar Excel', icon: FileSpreadsheet }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-bold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-900 shadow-xs border border-blue-300'
                  : 'bg-transparent text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-blue-700' : 'text-gray-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según pestaña */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Pestaña: Agregar Inventario o Ajustes (con Búsqueda por Nombre y Código) */}
        {(activeSubTab === 'agregar' || activeSubTab === 'ajustes') && (
          <div className="max-w-2xl bg-white border border-gray-200 rounded-lg shadow-xs p-6 space-y-5">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
              {activeSubTab === 'agregar' ? 'Agregar Existencia a Producto' : 'Ajustar Inventario'}
            </h3>

            {/* Búsqueda inteligente por nombre o código */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Buscar por Nombre o Escanear Código:
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={codeOrName}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Escribe el nombre del producto (ej: HARINA, ACEITE, GALLETA) o escanea el código..."
                  className="w-full text-sm font-medium pl-9 pr-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              {/* Sugerencias en tiempo real */}
              {isSearching && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-blue-300 rounded-md shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => selectProduct(prod)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-xs">{prod.producto}</div>
                        <div className="text-[10px] text-gray-500 font-mono">Código: {prod.codigo} | {prod.departamento_nombre}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-blue-900">${Number(prod.precio_venta).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-500">Stock: {Number(prod.existencia).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className="text-xs font-semibold p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-800 flex items-center space-x-1.5">
                <CheckCircle size={15} className="text-blue-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Detalle del producto seleccionado */}
            {foundProduct && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 animate-in fade-in duration-150">
                <div>
                  <div className="text-[11px] text-gray-500 uppercase font-semibold">Producto Seleccionado:</div>
                  <div className="text-base font-bold text-gray-900">{foundProduct.producto}</div>
                  <div className="text-xs font-mono text-gray-500 mt-0.5">
                    Código: <span className="font-bold text-gray-700">{foundProduct.codigo}</span> | Depto: <span className="font-semibold text-gray-700">{foundProduct.departamento_nombre || 'GENERAL'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-2xs">
                    <span className="text-gray-500 font-medium">Existencia Actual en Sistema:</span>
                    <div className="text-2xl font-black font-mono text-gray-900 mt-1">
                      {Number(foundProduct.existencia).toFixed(2)} <span className="text-xs font-normal text-gray-500">{foundProduct.unidad_medida}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border border-blue-200 shadow-2xs">
                    <label className="block text-gray-700 font-bold mb-1">
                      {activeSubTab === 'agregar' ? 'Cantidad a Agregar (+):' : 'Cantidad a Ajustar (+ o -):'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={qtyToAdd}
                      onChange={(e) => setQtyToAdd(e.target.value)}
                      className="w-full text-2xl font-bold font-mono text-blue-900 p-1 border border-blue-400 rounded focus:outline-hidden bg-blue-50/40 text-right"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFoundProduct(null);
                      setCodeOrName('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
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

        {/* Pestaña: Buscar & Ver Todos los Productos (Catálogo General) */}
        {activeSubTab === 'todos' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-2 text-gray-400" />
                <input
                  type="text"
                  value={generalSearch}
                  onChange={(e) => setGeneralSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o código de barras..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-300 rounded bg-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-600">Depto:</span>
                <select
                  value={filterDepto}
                  onChange={(e) => setFilterDepto(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 border border-gray-300 rounded bg-white"
                >
                  <option value="TODOS">TODOS</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.nombre}>{d.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={() => loadAllProducts(generalSearch)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-600 cursor-pointer"
                  title="Recargar"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[65vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#2a5885] text-white font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descripción del Producto</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3 text-right">P. Costo</th>
                    <th className="py-2.5 px-3 text-right">P. Venta</th>
                    <th className="py-2.5 px-3 text-right">Existencia</th>
                    <th className="py-2.5 px-3 text-right">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition">
                      <td className="py-2 px-3 font-mono font-medium text-gray-600">{p.codigo}</td>
                      <td className="py-2 px-3 font-bold text-gray-900">{p.producto}</td>
                      <td className="py-2 px-3 text-gray-600">{p.departamento_nombre || 'GENERAL'}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-600">${Number(p.precio_costo).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">${Number(p.precio_venta).toFixed(2)}</td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${p.existencia <= p.inv_minimo ? 'text-red-600' : 'text-emerald-700'}`}>
                        {Number(p.existencia).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-500">{Number(p.inv_minimo).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 border-t border-gray-200 bg-gray-50 text-[11px] text-gray-500 flex justify-between">
              <span>Mostrando {filteredProducts.length} productos</span>
            </div>
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
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Actualizar
              </button>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Ant.</th>
                  <th className="py-2.5 px-3 text-right">Nueva</th>
                  <th className="py-2.5 px-3">Motivo / Folio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kardexList.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500 font-mono">{k.created_at}</td>
                    <td className="py-2 px-3 font-bold text-gray-900">{k.producto}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        k.tipo === 'venta' ? 'bg-blue-100 text-blue-800' :
                        k.tipo === 'entrada_compra' ? 'bg-green-100 text-green-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {k.tipo}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-800">{Number(k.cantidad).toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-500">{Number(k.existencia_anterior).toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">{Number(k.existencia_nueva).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-600">{k.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pestaña: Importar / Exportar Excel */}
        {activeSubTab === 'importar_exportar' && (
          <div className="max-w-4xl space-y-6">
            {/* Sección Exportar */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 space-y-3">
              <div className="flex items-center space-x-2 text-blue-900 border-b border-gray-100 pb-2">
                <Download size={18} className="text-blue-700" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Exportar Inventario</h3>
              </div>
              <p className="text-xs text-gray-600">
                Descarga todo tu catálogo de productos y existencias actuales en formato Excel (.xlsx) o CSV con las columnas estándar: <br/>
                <code className="text-blue-800 font-bold">Código, Producto, P. Costo, P. Venta, P. Mayoreo, Existencia, Inv. Mínimo, Inv. Máximo, Departamento</code>
              </p>
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition cursor-pointer"
                >
                  <FileSpreadsheet size={16} />
                  <span>Descargar Inventario en Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded border border-gray-300 transition cursor-pointer"
                >
                  <FileText size={15} />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Sección Importar */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-900 border-b border-gray-100 pb-2">
                <Upload size={18} className="text-indigo-700" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Importar o Actualizar Inventario desde Excel</h3>
              </div>
              <p className="text-xs text-gray-600">
                Selecciona un archivo de Excel (<strong>.xlsx</strong>) o archivo <strong>.csv</strong> con la misma estructura. Si el código ya existe en la base de datos se actualizarán sus precios y existencias; si es un código nuevo se registrará automáticamente.
              </p>

              <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 bg-indigo-50/30 text-center space-y-2">
                <FileSpreadsheet size={36} className="mx-auto text-indigo-600" />
                <div className="text-xs font-bold text-gray-800">Selecciona tu archivo de inventario</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer text-gray-600"
                />
              </div>

              {importStatus && (
                <div className="text-xs font-semibold p-3 rounded bg-blue-50 border border-blue-200 text-blue-900">
                  {importStatus}
                </div>
              )}

              {/* Vista Previa */}
              {importPreview && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">
                      Vista previa de: <strong className="text-indigo-900">{importPreview.fileName}</strong> ({importPreview.totalRows} filas detectadas)
                    </span>
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleProcessImport}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow transition cursor-pointer disabled:bg-gray-400"
                    >
                      {isImporting ? 'Importando...' : 'Confirmar e Importar Ahora'}
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-gray-100 font-bold border-b">
                        <tr>
                          <th className="p-2">Código</th>
                          <th className="p-2">Producto</th>
                          <th className="p-2 text-right">P. Costo</th>
                          <th className="p-2 text-right">P. Venta</th>
                          <th className="p-2 text-right">Existencia</th>
                          <th className="p-2">Departamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importPreview.previewRows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2 font-mono">{r['Código'] || r['Codigo'] || r['codigo'] || ''}</td>
                            <td className="p-2 font-semibold">{r['Producto'] || r['producto'] || r['Descripción'] || ''}</td>
                            <td className="p-2 text-right font-mono">{r['P. Costo'] || r['P.Costo'] || ''}</td>
                            <td className="p-2 text-right font-mono font-bold text-blue-900">{r['P. Venta'] || r['P.Venta'] || ''}</td>
                            <td className="p-2 text-right font-mono">{r['Existencia'] || r['existencia'] || ''}</td>
                            <td className="p-2">{r['Departamento'] || r['departamento'] || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] text-gray-500 italic">
                    Mostrando las primeras 5 filas de {importPreview.totalRows}. Al pulsar "Confirmar e Importar", se procesará todo el archivo.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
