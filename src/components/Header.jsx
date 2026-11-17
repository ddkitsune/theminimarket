import React from 'react';
import { 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Package, 
  Boxes, 
  Truck, 
  Settings, 
  FileText, 
  Scissors, 
  BarChart3, 
  LogOut,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  cashierName = "ADMINISTRADOR", 
  onOpenCorte,
  exchangeRate,
  onOpenTasaModal,
  onSwitchUser
}) {
  const tabs = [
    { id: 'ventas', label: 'F1 Ventas', icon: ShoppingCart, keyHint: 'F1' },
    { id: 'creditos', label: 'F2 Créditos', icon: CreditCard, keyHint: 'F2' },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'F3 Productos', icon: Package, keyHint: 'F3' },
    { id: 'inventario', label: 'F4 Inventario', icon: Boxes, keyHint: 'F4' },
    { id: 'compras', label: 'Compras', icon: Truck },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'facturas', label: 'Facturas', icon: FileText },
    { id: 'corte', label: 'Corte', icon: Scissors, onClick: onOpenCorte },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 }
  ];

  return (
    <header className="bg-[#f0f4f8] border-b border-[#c5d5e4] select-none">
      {/* Barra superior de marca, tasa y cajero */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-[#e2e8f0]">
        <div className="flex items-center space-x-3">
          {/* Logo estilo eleventa */}
          <div className="flex items-center space-x-1.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-sm">
              <span className="text-cyan-300">e</span>
            </div>
            <div className="leading-none">
              <span className="text-2xl font-black tracking-tight text-gray-800">
                eleventa<span className="text-xs align-super text-blue-600 font-bold ml-0.5">®</span>
              </span>
              <div className="text-[10px] tracking-widest font-bold text-gray-500 uppercase -mt-0.5">
                Punto de Venta
              </div>
            </div>
          </div>
        </div>

        {/* TASA DE CAMBIO DEL DÍA (BIMONEDA $ / Bs.) - CLICKEABLE */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTasaModal}
            title="Haz clic para actualizar la tasa de cambio diaria"
            className="flex items-center space-x-2 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full transition shadow-xs cursor-pointer group"
          >
            <TrendingUp size={15} className="text-amber-700 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block leading-none">
                Tasa del Día
              </span>
              <span className="text-xs font-black font-mono text-amber-950">
                Bs. {Number(exchangeRate || 55).toFixed(2)} / $
              </span>
            </div>
            <RefreshCw size={12} className="text-amber-600 ml-1 opacity-70 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onSwitchUser}
            title="Haz clic para cambiar de empleado / cajero con PIN"
            className="text-right p-1 rounded hover:bg-gray-100 transition cursor-pointer group"
          >
            <div className="text-[10px] text-gray-500 uppercase font-semibold group-hover:text-blue-700">
              Le atiende (Cambiar):
            </div>
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wide group-hover:text-blue-900 flex items-center justify-end space-x-1">
              <span>{cashierName}</span>
            </div>
          </button>

          <div className="flex items-center space-x-1.5">
            <button 
              title="Notificaciones y avisos"
              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded border border-amber-200 transition"
            >
              <AlertCircle size={17} />
            </button>
            <button 
              title="Salir del sistema"
              onClick={() => {
                if (window.confirm("¿Seguro que deseas salir del Punto de Venta?")) {
                  window.close();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded border border-gray-300 transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de pestañas de navegación principal */}
      <div className="flex items-center px-2 pt-1.5 space-x-1 overflow-x-auto bg-gradient-to-b from-[#f8fafc] to-[#eef4f9]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.onClick) {
                  tab.onClick();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-t border-l border-r transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-900 border-[#94b3cf] shadow-sm font-bold -mb-[1px] pb-2'
                  : 'bg-[#e2eaf2] text-gray-700 hover:bg-[#d9e5f0] border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-blue-700' : 'text-gray-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
