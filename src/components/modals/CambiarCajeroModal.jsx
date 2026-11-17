import React, { useState, useEffect } from 'react';
import { Users, X, Key, Shield, Check } from 'lucide-react';
import { posApi } from '../../services/api';

export default function CambiarCajeroModal({ isOpen, onClose, onSelectUser, currentUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || 1);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const list = await posApi.getUsers();
      setUsers(list?.filter(u => u.activo) || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor introduce tu PIN.');
      return;
    }

    try {
      const targetUser = users.find(u => u.id === Number(selectedUserId));
      if (!targetUser) {
        setError('Usuario no seleccionado.');
        return;
      }

      // Validar PIN
      const res = await posApi.loginUser(pin.trim());
      if (res && res.id === targetUser.id) {
        onSelectUser(res);
        onClose();
      } else {
        setError('PIN incorrecto para el cajero seleccionado.');
      }
    } catch (err) {
      setError('Error al autenticar: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 w-full max-w-sm overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-[#2a5885] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wide">Cambiar Cajero / Empleado</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Selecciona tu Nombre:</label>
            <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-1 bg-gray-50">
              {users.map((u) => {
                const isSelected = Number(selectedUserId) === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setError('');
                    }}
                    className={`w-full text-left p-2 rounded flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{u.nombre}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        Usuario: {u.usuario} | {u.rol.toUpperCase()}
                      </div>
                    </div>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Introduce tu PIN:</label>
            <div className="relative">
              <Key size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                maxLength="6"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full pl-9 pr-3 py-2 text-lg font-mono font-bold text-center tracking-widest border border-blue-400 rounded focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded text-center">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded shadow transition cursor-pointer"
            >
              Iniciar Turno / Cambiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
