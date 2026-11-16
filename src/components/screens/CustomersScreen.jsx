import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Save, Search, CheckCircle } from 'lucide-react';
import { posApi } from '../../services/api';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    folio: null,
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    domicilio_1: '',
    domicilio_2: '',
    colonia: '',
    municipio_estado: '',
    codigo_postal: '',
    notas: '',
    tiene_credito: 1,
    limite_credito: 100.0
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    const list = await posApi.getCustomers(search);
    setCustomers(list);
    if (!selectedCustomer && list.length > 0) {
      handleSelectCustomer(list[0]);
    }
  };

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setFormData({
      id: c.id,
      folio: c.folio,
      nombres: c.nombres,
      apellidos: c.apellidos || '',
      telefono: c.telefono || '',
      correo: c.correo || '',
      domicilio_1: c.domicilio_1 || '',
      domicilio_2: c.domicilio_2 || '',
      colonia: c.colonia || '',
      municipio_estado: c.municipio_estado || '',
      codigo_postal: c.codigo_postal || '',
      notas: c.notas || '',
      tiene_credito: c.tiene_credito ? 1 : 0,
      limite_credito: c.limite_credito || 0
    });
  };

  const handleNew = () => {
    setSelectedCustomer(null);
    setFormData({
      id: null,
      folio: null,
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      domicilio_1: '',
      domicilio_2: '',
      colonia: '',
      municipio_estado: '',
      codigo_postal: '',
      notas: '',
      tiene_credito: 1,
      limite_credito: 100.0
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombres.trim()) {
      alert("Por favor ingresa los nombres del cliente.");
      return;
    }

    try {
      await posApi.saveCustomer(formData);
      setMessage("¡Cliente guardado con éxito!");
      setTimeout(() => setMessage(''), 3000);
      loadCustomers();
    } catch (err) {
      alert("Error al guardar cliente: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Título */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider">ADMINISTRACIÓN DE CLIENTES</h2>
      </div>

      {/* Barra de Botones Superiores Estilo Eleventa Pantalla 3 */}
      <div className="bg-[#e4edf5] border-b border-[#c2d7eb] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleNew}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-[#b4cbe0] rounded text-blue-900 font-bold shadow-2xs transition"
          >
            <UserPlus size={15} />
            <span>Nuevo Cliente</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition cursor-pointer"
          >
            <Save size={15} />
            <span>Guardar</span>
          </button>
        </div>

        {message && (
          <div className="flex items-center space-x-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
            <CheckCircle size={15} />
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lado Izquierdo: Lista de Clientes con Folio y Búsqueda */}
        <div className="w-80 md:w-96 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {customers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const initials = `${c.nombres[0] || ''}${c.apellidos[0] || ''}`.toUpperCase();
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`p-2.5 flex items-center space-x-3 cursor-pointer text-xs transition ${
                    isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    {initials || 'CL'}
                  </div>
                  <div className="truncate flex-1">
                    <div className="font-bold text-gray-900 truncate">
                      {c.folio} - {c.nombres} {c.apellidos}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {c.telefono || c.correo || 'Sin contacto'}
                    </div>
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                No hay clientes registrados aún.
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Formulario Completo de Cliente (Pantalla 3) */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form onSubmit={handleSave} className="max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
              {formData.id ? `Modificar Cliente #${formData.folio}` : 'Nuevo Cliente'}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Nombres:</label>
                <input
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Ej: David Miguel"
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Apellidos:</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Ej: González"
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="0412-1234567"
                  className="w-full p-2 border border-gray-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Domicilio 1:</label>
                <input
                  type="text"
                  value={formData.domicilio_1}
                  onChange={(e) => setFormData({ ...formData, domicilio_1: e.target.value })}
                  placeholder="Calle, Avenida, Casa..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Domicilio 2:</label>
                <input
                  type="text"
                  value={formData.domicilio_2}
                  onChange={(e) => setFormData({ ...formData, domicilio_2: e.target.value })}
                  placeholder="Referencia o apartamento"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Colonia / Sector:</label>
                <input
                  type="text"
                  value={formData.colonia}
                  onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Municipio / Estado:</label>
                <input
                  type="text"
                  value={formData.municipio_estado}
                  onChange={(e) => setFormData({ ...formData, municipio_estado: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Código Postal:</label>
                <input
                  type="text"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-gray-700 uppercase mb-1">Notas / Comentarios:</label>
              <textarea
                rows="2"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Observaciones sobre el cliente..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {/* Configuración de Crédito */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 text-xs">
              <label className="flex items-center space-x-2 font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.tiene_credito)}
                  onChange={(e) => setFormData({ ...formData, tiene_credito: e.target.checked ? 1 : 0 })}
                  className="rounded text-blue-600"
                />
                <span>Tiene crédito autorizado</span>
              </label>

              {Boolean(formData.tiene_credito) && (
                <div className="pt-1 flex items-center space-x-2">
                  <span className="text-gray-600">Límite de Crédito ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limite_credito}
                    onChange={(e) => setFormData({ ...formData, limite_credito: parseFloat(e.target.value) || 0 })}
                    className="w-32 font-mono font-bold p-1.5 bg-white border border-gray-300 rounded text-right"
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
