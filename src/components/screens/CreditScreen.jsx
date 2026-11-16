import React, { useState, useEffect } from 'react';
import { Search, DollarSign, UserCheck, Check, History, X } from 'lucide-react';
import { posApi } from '../../services/api';

export default function CreditScreen() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoNotas, setAbonoNotas] = useState('');
  const [statement, setStatement] = useState(null);

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

  const handleSelectCustomer = async (c) => {
    setSelectedCustomer(c);
    const data = await posApi.getCustomerStatement(c.id);
    setStatement(data);
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    const val = parseFloat(abonoMonto);
    if (!val || val <= 0) {
      alert("Introduce un monto de abono válido.");
      return;
    }

    try {
      await posApi.addCustomerPayment({
        clienteId: selectedCustomer.id,
        monto: val,
        notas: abonoNotas || 'Abono en efectivo'
      });
      alert("Abono registrado con éxito.");
      setIsAbonoModalOpen(false);
      setAbonoMonto('');
      setAbonoNotas('');
      loadCustomers();
      if (selectedCustomer) handleSelectCustomer(selectedCustomer);
    } catch (err) {
      alert("Error al registrar abono: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Título */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider">CRÉDITO A CLIENTES (CUENTAS POR COBRAR)</h2>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Lista de Clientes con Saldo (Modal/Card Estilo Eleventa Pantalla 2) */}
        <div className="w-96 bg-white border border-gray-200 rounded-lg shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Estado de Cuenta - Buscar Cliente
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ingresa el folio o nombre del cliente..."
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
                  className={`p-3 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-emerald-700 text-white' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    {/* Avatar redondo de iniciales estilo eleventa */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-white text-emerald-800' : 'bg-blue-600 text-white'
                    }`}>
                      {initials || 'CL'}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">
                        {c.folio} - {c.nombres} {c.apellidos}
                      </div>
                      <div className={`text-[11px] truncate ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>
                        {c.correo || c.telefono || 'Sin datos de contacto'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right pl-2 shrink-0">
                    <div className={`font-mono font-bold text-xs ${
                      isSelected ? 'text-white' : c.saldo_actual > 0 ? 'text-rose-600' : 'text-gray-600'
                    }`}>
                      ${Number(c.saldo_actual).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-xs">
                No hay clientes registrados o coincidentes.
              </div>
            )}
          </div>
        </div>

        {/* Detalle y Estado de Cuenta */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-xs flex flex-col overflow-hidden">
          {selectedCustomer ? (
            <>
              {/* Resumen del Cliente */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedCustomer.nombres} {selectedCustomer.apellidos}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Folio: #{selectedCustomer.folio} | Tel: {selectedCustomer.telefono || 'N/A'} | Correo: {selectedCustomer.correo || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Saldo Deudor:</div>
                    <div className="text-2xl font-black font-mono text-rose-600">
                      ${Number(selectedCustomer.saldo_actual).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAbonoModalOpen(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow transition cursor-pointer"
                  >
                    <DollarSign size={15} />
                    <span>Registrar Abono</span>
                  </button>
                </div>
              </div>

              {/* Historial de Movimientos */}
              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
                  <History size={15} />
                  <span>Historial de Compras a Crédito y Abonos</span>
                </h4>

                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                      <th className="py-2 px-3 text-right">Saldo Anterior</th>
                      <th className="py-2 px-3 text-right">Saldo Nuevo</th>
                      <th className="py-2 px-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statement && statement.movimientos.length > 0 ? (
                      statement.movimientos.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-gray-500">{m.created_at}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.tipo === 'cargo' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {m.tipo === 'cargo' ? 'Compra (Cargo)' : 'Abono (Pago)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            ${Number(m.monto).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-500">
                            ${Number(m.saldo_anterior).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-gray-800">
                            ${Number(m.saldo_nuevo).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{m.notas}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-gray-400">
                          Este cliente no tiene movimientos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Selecciona un cliente de la lista para ver su estado de cuenta.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Registrar Abono */}
      {isAbonoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden">
            <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide">Abono a Cuenta</h3>
              <button onClick={() => setIsAbonoModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAbonar} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monto del Abono ($):</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-2xl font-bold font-mono p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas / Referencia:</label>
                <input
                  type="text"
                  value={abonoNotas}
                  onChange={(e) => setAbonoNotas(e.target.value)}
                  placeholder="Ej: Pago en efectivo por el cliente"
                  className="w-full text-xs p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAbonoModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
