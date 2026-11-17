import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SalesScreen from './components/SalesScreen';
import ProductsScreen from './components/screens/ProductsScreen';
import InventoryScreen from './components/screens/InventoryScreen';
import PurchasesScreen from './components/screens/PurchasesScreen';
import CreditScreen from './components/screens/CreditScreen';
import CustomersScreen from './components/screens/CustomersScreen';
import ReportsScreen from './components/screens/ReportsScreen';
import SettingsScreen from './components/screens/SettingsScreen';

import CobrarModal from './components/modals/CobrarModal';
import BuscarProductoModal from './components/modals/BuscarProductoModal';
import VerificadorModal from './components/modals/VerificadorModal';
import MovimientoCajaModal from './components/modals/MovimientoCajaModal';
import CorteModal from './components/modals/CorteModal';
import TasaCambioModal from './components/modals/TasaCambioModal';
import CambiarCajeroModal from './components/modals/CambiarCajeroModal';

import { posApi } from './services/api';
import { generateReceiptHtml } from './services/ticketPrinter';

export default function App() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [turno, setTurno] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(55.00);
  const [currentUser, setCurrentUser] = useState({ id: 1, nombre: 'ADMINISTRADOR', usuario: 'admin', rol: 'admin' });

  // Estado de los tickets de venta
  const [tickets, setTickets] = useState([
    { id: 1, name: 'Ticket 1', items: [], cliente: null }
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);

  // Estados de Modales
  const [isCobrarOpen, setIsCobrarOpen] = useState(false);
  const [isBuscarOpen, setIsBuscarOpen] = useState(false);
  const [isVerificadorOpen, setIsVerificadorOpen] = useState(false);
  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState('entrada');
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const [isTasaModalOpen, setIsTasaModalOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);

  // Iniciar turno y tasa de cambio al arrancar
  useEffect(() => {
    async function initApp() {
      const shift = await posApi.getCurrentShift();
      setTurno(shift);
      const tasaData = await posApi.getExchangeRate();
      if (tasaData && tasaData.tasa) {
        setExchangeRate(tasaData.tasa);
      }
    }
    initApp();
  }, []);

  // Listener global de atajos de teclado (F1 - F12)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        const current = tickets[activeTicketIndex];
        if (current && current.items.length > 0) {
          setIsCobrarOpen(true);
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsBuscarOpen(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsVerificadorOpen(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setMovimientoTipo('entrada');
        setIsMovimientoOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setMovimientoTipo('salida');
        setIsMovimientoOpen(true);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('ventas');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('creditos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('productos');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('inventario');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [tickets, activeTicketIndex]);

  // Completar Venta e Imprimir Ticket
  const handleConfirmSale = async ({ metodoPago, pagoCon, cambio, tasaCambio, referencia, clienteId, clienteNombre }) => {
    const current = tickets[activeTicketIndex];
    if (!current || current.items.length === 0) return;

    try {
      const res = await posApi.completeSale({
        turnoId: turno?.id || 1,
        clienteId: clienteId || current.cliente?.id || null,
        items: current.items,
        pagoCon,
        metodoPago,
        referencia: referencia || '',
        userId: currentUser?.id || 1
      });

      // Generar e imprimir ticket térmico
      const ticketHtml = generateReceiptHtml({
        folio: res.folio,
        items: current.items,
        total: res.total,
        tasaCambio: tasaCambio || exchangeRate,
        pagoCon,
        cambio: res.cambio,
        metodoPago,
        referencia: referencia || '',
        clienteNombre: clienteNombre || (current.cliente ? `${current.cliente.nombres} ${current.cliente.apellidos || ''}` : ''),
        cajero: currentUser?.nombre || 'ADMINISTRADOR'
      });

      posApi.printTicket(ticketHtml);

      // Limpiar ticket activo
      setTickets((prev) => {
        const updated = [...prev];
        updated[activeTicketIndex] = {
          ...updated[activeTicketIndex],
          items: [],
          cliente: null
        };
        return updated;
      });

      setIsCobrarOpen(false);
    } catch (err) {
      alert("Error al procesar la venta: " + err.message);
    }
  };

  // Reimprimir Último Ticket
  const handleReprintLastTicket = async () => {
    try {
      const last = await posApi.getLastSale();
      if (!last) {
        alert("No hay ventas registradas para reimprimir.");
        return;
      }

      const ticketHtml = generateReceiptHtml({
        folio: last.folio_ticket,
        fecha: last.fecha,
        items: last.items,
        total: last.total,
        tasaCambio: exchangeRate,
        cambio: last.cambio,
        metodoPago: last.pagos?.[0]?.metodo || 'efectivo',
        negocio: last.negocio
      });

      await posApi.printTicket(ticketHtml);
      alert(`Reimprimiendo Ticket #${last.folio_ticket}...`);
    } catch (err) {
      alert("Error al reimprimir: " + err.message);
    }
  };

  // Agregar producto desde modal F10 o F9
  const handleAddProductFromModal = (product) => {
    setTickets((prev) => {
      const updated = [...prev];
      const cur = { ...updated[activeTicketIndex] };
      const existing = cur.items.find((it) => it.id === product.id);

      if (existing) {
        existing.cantidad += 1;
      } else {
        cur.items.push({
          id: product.id,
          codigo: product.codigo,
          producto: product.producto,
          precio_costo: product.precio_costo,
          precio: product.precio_venta,
          cantidad: 1,
          existencia: product.existencia,
          tipo_venta: product.tipo_venta
        });
      }
      updated[activeTicketIndex] = cur;
      return updated;
    });
  };

  const currentTicket = tickets[activeTicketIndex] || { items: [] };
  const currentTotalUsd = currentTicket.items.reduce((acc, it) => acc + (it.precio * it.cantidad), 0);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 font-sans">
      {/* Header eleventa con Tasa del Día y Usuario Activo */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCorte={() => setIsCorteOpen(true)}
        exchangeRate={exchangeRate}
        onOpenTasaModal={() => setIsTasaModalOpen(true)}
        cashierName={currentUser?.nombre || "ADMINISTRADOR"}
        onSwitchUser={() => setIsSwitchUserOpen(true)}
      />

      {/* Pantalla Activa */}
      {activeTab === 'ventas' && (
        <SalesScreen
          tickets={tickets}
          setTickets={setTickets}
          activeTicketIndex={activeTicketIndex}
          setActiveTicketIndex={setActiveTicketIndex}
          exchangeRate={exchangeRate}
          onReprintLastTicket={handleReprintLastTicket}
          onOpenCobrar={() => setIsCobrarOpen(true)}
          onOpenBuscar={() => setIsBuscarOpen(true)}
          onOpenVerificador={() => setIsVerificadorOpen(true)}
          onOpenEntrada={() => {
            setMovimientoTipo('entrada');
            setIsMovimientoOpen(true);
          }}
          onOpenSalida={() => {
            setMovimientoTipo('salida');
            setIsMovimientoOpen(true);
          }}
        />
      )}

      {activeTab === 'productos' && <ProductsScreen />}
      {activeTab === 'inventario' && <InventoryScreen />}
      {activeTab === 'compras' && <PurchasesScreen />}
      {activeTab === 'creditos' && <CreditScreen />}
      {activeTab === 'clientes' && <CustomersScreen />}
      {activeTab === 'reportes' && <ReportsScreen />}
      {activeTab === 'configuracion' && <SettingsScreen />}

      {activeTab === 'facturas' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
          <div className="text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 text-base mb-1">Módulo: Facturación</h3>
            <p className="text-gray-500 mb-4">Exportación y control de facturas por ventas locales.</p>
            <button
              onClick={() => setActiveTab('ventas')}
              className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
            >
              [F1] Volver a Ventas
            </button>
          </div>
        </div>
      )}

      {/* Modales Globales */}
      <CobrarModal
        isOpen={isCobrarOpen}
        onClose={() => setIsCobrarOpen(false)}
        totalUsd={currentTotalUsd}
        exchangeRate={exchangeRate}
        onConfirmSale={handleConfirmSale}
        clienteSeleccionado={currentTicket.cliente}
      />

      <TasaCambioModal
        isOpen={isTasaModalOpen}
        onClose={() => setIsTasaModalOpen(false)}
        currentRate={exchangeRate}
        onRateUpdated={(newRate) => setExchangeRate(newRate)}
      />

      <BuscarProductoModal
        isOpen={isBuscarOpen}
        onClose={() => setIsBuscarOpen(false)}
        onSelectProduct={handleAddProductFromModal}
      />

      <VerificadorModal
        isOpen={isVerificadorOpen}
        onClose={() => setIsVerificadorOpen(false)}
        onAddProduct={handleAddProductFromModal}
      />

      <MovimientoCajaModal
        isOpen={isMovimientoOpen}
        onClose={() => setIsMovimientoOpen(false)}
        tipo={movimientoTipo}
        turnoId={turno?.id || 1}
      />

      <CorteModal
        isOpen={isCorteOpen}
        onClose={() => setIsCorteOpen(false)}
        turnoId={turno?.id || 1}
      />

      <CambiarCajeroModal
        isOpen={isSwitchUserOpen}
        onClose={() => setIsSwitchUserOpen(false)}
        currentUser={currentUser}
        onSelectUser={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
