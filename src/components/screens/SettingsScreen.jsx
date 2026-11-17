import React, { useState, useEffect } from 'react';
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
  Download,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Key
} from 'lucide-react';
import { posApi } from '../../services/api';

export default function SettingsScreen() {
  const [activeDevice, setActiveDevice] = useState('cajeros');
  const [savedMsg, setSavedMsg] = useState('');

  // Configuración general
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

  // Gestión de Usuarios y Cajeros
  const [usersList, setUsersList] = useState([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    id: null,
    nombre: '',
    usuario: '',
    pin: '',
    rol: 'cajero',
    activo: 1
  });
  const [userMsg, setUserMsg] = useState('');

  useEffect(() => {
    if (activeDevice === 'cajeros') {
      loadUsers();
    }
  }, [activeDevice]);

  const loadUsers = async () => {
    try {
      const list = await posApi.getUsers();
      setUsersList(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('¡Configuración guardada correctamente!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleOpenUserForm = (u = null) => {
    if (u) {
      setUserForm({
        id: u.id,
        nombre: u.nombre,
        usuario: u.usuario,
        pin: u.pin || '',
        rol: u.rol,
        activo: u.activo
      });
    } else {
      setUserForm({
        id: null,
        nombre: '',
        usuario: '',
        pin: '',
        rol: 'cajero',
        activo: 1
      });
    }
    setIsEditingUser(true);
    setUserMsg('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.nombre.trim() || !userForm.usuario.trim()) {
      setUserMsg('Por favor completa el nombre y usuario.');
      return;
    }

    try {
      await posApi.saveUser(userForm);
      setUserMsg('¡Usuario guardado con éxito!');
      setTimeout(() => {
        setIsEditingUser(false);
        loadUsers();
        setUserMsg('');
      }, 800);
    } catch (err) {
      setUserMsg('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async (id, nombre) => {
    if (id === 1) {
      alert("No se puede eliminar el administrador principal.");
      return;
    }
    if (window.confirm(`¿Seguro que deseas desactivar al usuario "${nombre}"?`)) {
      try {
        await posApi.deleteUser(id);
        loadUsers();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const sections = [
    {
      title: 'General',
      items: [
        { id: 'cajeros', label: 'Cajeros & Empleados', icon: Users },
        { id: 'negocio', label: 'Datos del Negocio', icon: Settings },
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
        {/* Panel Izquierdo: Iconos y Secciones */}
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
                      onClick={() => {
                        setActiveDevice(item.id);
                        setIsEditingUser(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
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
          {/* MÓDULO: GESTIÓN DE CAJEROS Y EMPLEADOS */}
          {activeDevice === 'cajeros' && (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Usuarios y Empleados del Sistema</h3>
                  <p className="text-xs text-gray-500">Administra quiénes tienen acceso al punto de venta y asigna su PIN de cobro.</p>
                </div>
                {!isEditingUser && (
                  <button
                    type="button"
                    onClick={() => handleOpenUserForm()}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition cursor-pointer"
                  >
                    <UserPlus size={15} />
                    <span>+ Nuevo Empleado</span>
                  </button>
                )}
              </div>

              {/* Formulario de Alta / Edición de Usuario */}
              {isEditingUser ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4 max-w-lg">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    {userForm.id ? 'Editar Empleado / Cajero' : 'Registrar Nuevo Empleado'}
                  </h4>

                  {userMsg && (
                    <div className="p-2 text-xs font-bold rounded bg-blue-100 text-blue-900">
                      {userMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Nombre Completo:</label>
                      <input
                        type="text"
                        value={userForm.nombre}
                        onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                        placeholder="Ej: MARIA PEREZ"
                        className="w-full p-2 border border-gray-300 rounded uppercase font-bold bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Nombre de Usuario (Login):</label>
                      <input
                        type="text"
                        value={userForm.usuario}
                        onChange={(e) => setUserForm({ ...userForm, usuario: e.target.value })}
                        placeholder="Ej: maria"
                        className="w-full p-2 border border-gray-300 rounded font-mono bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">PIN / Clave de Acceso:</label>
                        <input
                          type="password"
                          maxLength="6"
                          value={userForm.pin}
                          onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                          placeholder="Ej: 1234"
                          className="w-full p-2 border border-gray-300 rounded font-mono font-bold bg-white text-center"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Rol / Permiso:</label>
                        <select
                          value={userForm.rol}
                          onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded font-bold bg-white"
                        >
                          <option value="cajero">Cajero (Ventas y Cobro)</option>
                          <option value="admin">Administrador (Total)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="user_activo"
                        checked={Boolean(userForm.activo)}
                        onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked ? 1 : 0 })}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                      <label htmlFor="user_activo" className="font-bold text-gray-700 cursor-pointer">
                        Usuario Activo (Puede iniciar sesión y cobrar)
                      </label>
                    </div>

                    <div className="pt-3 border-t flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingUser(false)}
                        className="px-4 py-2 border border-gray-300 rounded font-bold text-gray-600 bg-white hover:bg-gray-100 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition cursor-pointer"
                      >
                        Guardar Empleado
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Tabla de Usuarios Registrados */
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#2a5885] text-white font-bold">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Nombre del Empleado</th>
                        <th className="py-2.5 px-3">Usuario</th>
                        <th className="py-2.5 px-3">Rol</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50/40 transition">
                          <td className="py-2.5 px-3 font-mono font-medium text-gray-500">#{u.id}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">{u.nombre}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-700 font-semibold">{u.usuario}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.rol}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {u.activo ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                Activo
                              </span>
                            ) : (
                              <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenUserForm(u)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Editar empleado"
                            >
                              <Edit2 size={14} />
                            </button>
                            {u.id !== 1 && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.nombre)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Desactivar usuario"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeDevice !== 'cajeros' && (
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
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ancho del Papel:</label>
                    <select
                      value={settings.impresoraAncho}
                      onChange={(e) => setSettings({ ...settings, impresoraAncho: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                    >
                      <option value="80mm">80 milímetros (Estándar)</option>
                      <option value="58mm">58 milímetros (Compacta)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeDevice === 'bascula' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-2">
                    Báscula Digital Serial (RS-232 / USB)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
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
                      Genera una copia de seguridad timestamped completa (Hot Backup) con todos los productos, ventas, clientes y configuración en la subcarpeta de respaldos.
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
          )}
        </div>
      </div>
    </div>
  );
}
