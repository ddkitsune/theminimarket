import React, { useState } from 'react';
import { 
  Settings, 
  Printer, 
  Barcode, 
  Scale, 
  CreditCard, 
  Database, 
  HardDriveDownload, 
  Users, 
  Receipt, 
  Coins, 
  Percent,
  CheckCircle2,
  Download
} from 'lucide-react';
import { posApi } from '../../services/api';

export default function SettingsScreen() {
  const [activeDevice, setActiveDevice] = useState('impresora');
  const [savedMsg, setSavedMsg] = useState('');

  const [settings, setSettings] = useState({
    nombreNegocio: 'MINIMARKET LA POPULAR',
    direccion: 'Av. Bolívar, Local 12',
    telefono: '0412-2391006',
    mensajeTicket: '¡Gracias por su compra, vuelva pronto!',
    impresoraNombre: 'Generic / Text Only (ESC/POS 80mm)',
    impresoraAncho: '80mm',
    abrirCajon: true,
    puertoBascula: 'COM1',
    baudrateBascula: '9600',
    monedaSimbolo: '$',
    impuestoPorcentaje: 0
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('¡Configuración guardada correctamente!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const sections = [
    {
      title: 'General',
      items: [
        { id: 'negocio', label: 'Datos del Negocio', icon: Settings },
        { id: 'cajeros', label: 'Cajeros & Permisos', icon: Users },
        { id: 'bd', label: 'Base de Datos SQLite', icon: Database },
      ]
    },
    {
      title: 'Personalización',
      items: [
        { id: 'ticket', label: 'Formato del Ticket', icon: Receipt },
        { id: 'moneda', label: 'Símbolo de Moneda', icon: Coins },
        { id: 'impuestos', label: 'Impuestos / IVA', icon: Percent },
      ]
    },
    {
      title: 'Dispositivos y Periféricos POS',
      items: [
        { id: 'impresora', label: 'Impresora de Tickets', icon: Printer },
        { id: 'lector', label: 'Lector de Códigos', icon: Barcode },
        { id: 'cajon', label: 'Cajón de Dinero', icon: CreditCard },
        { id: 'bascula', label: 'Báscula Digital', icon: Scale },
      ]
    },
    {
      title: 'Mantenimiento',
      items: [
        { id: 'respaldo', label: 'Respaldo Automático', icon: HardDriveDownload },
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fa] overflow-hidden">
      {/* Barra de Título */}
      <div className="bg-[#2a5885] px-4 py-2 flex items-center justify-between text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider">CONFIGURACIÓN DEL SISTEMA</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo: Iconos y Secciones Estilo Eleventa Pantalla 7 */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2 pb-1 border-b border-gray-100">
                {sec.title}
              </h4>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeDevice === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveDevice(item.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-white' : 'text-blue-700'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Panel Derecho: Parámetros del Dispositivo Seleccionado */}
        <div className="flex-1 bg-white p-8 overflow-y-auto">
          <form onSubmit={handleSave} className="max-w-xl space-y-5">
            {savedMsg && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>{savedMsg}</span>
              </div>
            )}

            {activeDevice === 'impresora' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">
                  Impresora Térmica de Tickets (ESC/POS)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Impresora en Windows:</label>
                  <select
                    value={settings.impresoraNombre}
                    onChange={(e) => setSettings({ ...settings, impresoraNombre: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                  >
                    <option value="Generic / Text Only (ESC/POS 80mm)">Generic / Text Only (Recomendada)</option>
                    <option value="EPSON TM-T20">EPSON TM-T20 / TM-T88</option>
                    <option value="POS-58">POS-58 (Impresora 58mm)</option>
                    <option value="Xprinter XP-58">Xprinter XP-58 / XP-80</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ancho de Papel:</label>
                  <div className="flex space-x-4 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ancho"
                        value="80mm"
                        checked={settings.impresoraAncho === '80mm'}
                        onChange={() => setSettings({ ...settings, impresoraAncho: '80mm' })}
                      />
                      <span>80 mm (Estándar supermercado)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ancho"
                        value="58mm"
                        checked={settings.impresoraAncho === '58mm'}
                        onChange={() => setSettings({ ...settings, impresoraAncho: '58mm' })}
                      />
                      <span>58 mm (Ticket angosto)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.abrirCajon}
                      onChange={(e) => setSettings({ ...settings, abrirCajon: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Enviar pulso al cajón de dinero al imprimir ticket</span>
                  </label>
                </div>
              </div>
            )}

            {activeDevice === 'bascula' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">
                  Báscula Digital Electrónica (Granel / Charcutería)
                </h3>
                <p className="text-xs text-gray-600">
                  Configura la lectura directa del peso desde la báscula a través del puerto serial COM / USB:
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Puerto COM:</label>
                    <select
                      value={settings.puertoBascula}
                      onChange={(e) => setSettings({ ...settings, puertoBascula: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded font-mono"
                    >
                      <option value="COM1">COM1</option>
                      <option value="COM2">COM2</option>
                      <option value="COM3">COM3</option>
                      <option value="COM4">COM4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Velocidad (Baudios):</label>
                    <select
                      value={settings.baudrateBascula}
                      onChange={(e) => setSettings({ ...settings, baudrateBascula: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded font-mono"
                    >
                      <option value="9600">9600 baud</option>
                      <option value="4800">4800 baud</option>
                      <option value="2400">2400 baud</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeDevice === 'negocio' && (
              <div className="space-y-3 text-xs">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">Datos del Comercio</h3>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nombre Comercial:</label>
                  <input
                    type="text"
                    value={settings.nombreNegocio}
                    onChange={(e) => setSettings({ ...settings, nombreNegocio: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dirección:</label>
                  <input
                    type="text"
                    value={settings.direccion}
                    onChange={(e) => setSettings({ ...settings, direccion: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={settings.telefono}
                    onChange={(e) => setSettings({ ...settings, telefono: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded font-mono"
                  />
                </div>
              </div>
            )}

            {activeDevice === 'respaldo' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-gray-900 border-b pb-2">Respaldos de Base de Datos Local</h3>
                <p className="text-gray-600">
                  La base de datos se almacena en SQLite en <code className="bg-gray-100 p-1 font-mono text-blue-900 rounded">database/minimarket.db</code>.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 space-y-3">
                  <div className="font-bold text-sm">Respaldo Inmediato a Disco / USB</div>
                  <p className="text-[11px] text-blue-800">
                    Genera una copia de seguridad timestamped completa (Hot Backup) con todos los productos, ventas, clientes y configuración en la carpeta <code className="font-mono font-bold">database/backups/</code>.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await posApi.backupDatabase();
                          alert(`¡Copia de seguridad creada con éxito!\nArchivo: ${res.fileName}\nUbicación: ${res.path}`);
                        } catch (err) {
                          alert("Error al generar respaldo: " + err.message);
                        }
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded shadow transition cursor-pointer"
                    >
                      <Download size={15} />
                      <span>Generar Copia de Seguridad Ahora</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded shadow transition cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
