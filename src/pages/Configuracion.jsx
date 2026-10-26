import { useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { LogOut, KeyRound, User, RefreshCw, Wifi, WifiOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil, actualizarPassword } from '../services/auth';
import { useSyncEstado } from '../hooks/useSyncEstado';
import AparienciaCard from '../components/config/AparienciaCard';
import NotificacionesCard from '../components/config/NotificacionesCard';
import CalendarioCard from '../components/config/CalendarioCard';
import VersionCard from '../components/config/VersionCard';
import RespaldoCard from '../components/config/RespaldoCard';
import BaseDatosCard from '../components/config/BaseDatosCard';
import { vaciarCola } from '../offline/sync';

export default function Configuracion() {
  const { usuario, perfil, refrescarPerfil, logout } = useAuth();
  const [nombre, setNombre] = useState(perfil?.nombre || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const sync = useSyncEstado();

  const guardarNombre = async () => {
    if (!nombre.trim()) return;
    setGuardandoNombre(true);
    try {
      await actualizarPerfil(usuario.id, { nombre: nombre.trim() });
      await refrescarPerfil();
      setMensaje('Nombre actualizado');
    } finally {
      setGuardandoNombre(false);
    }
  };

  const cambiarPassword = async () => {
    if (nuevaPassword.length < 6) return setMensaje('La contraseña debe tener al menos 6 caracteres');
    setGuardandoPassword(true);
    try {
      await actualizarPassword(nuevaPassword);
      setNuevaPassword('');
      setMensaje('Contraseña actualizada');
    } catch (err) {
      setMensaje(mensajeAmigable(err, 'guardar los cambios'));
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      {mensaje && <p className="rounded-sm2 bg-primarySoft px-4 py-2.5 text-sm font-semibold text-primary">{mensaje}</p>}

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold"><User size={16} /> Perfil</p>
        <p className="mb-2 text-xs text-textSecondary">{usuario?.email}</p>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="flex-1 rounded-sm2 bg-primarySoft/60 px-4 py-2.5 text-sm outline-none" />
          <button onClick={guardarNombre} disabled={guardandoNombre} className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white disabled:opacity-60">
            Guardar
          </button>
        </div>
      </section>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold"><KeyRound size={16} /> Contraseña</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="flex-1 rounded-sm2 bg-primarySoft/60 px-4 py-2.5 text-sm outline-none"
          />
          <button onClick={cambiarPassword} disabled={guardandoPassword} className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white disabled:opacity-60">
            Cambiar
          </button>
        </div>
      </section>

      <RespaldoCard />

      {perfil?.es_admin && (
        <>
          <Link to="/admin" className="mb-4 flex items-center justify-between rounded-md2 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primarySoft text-primary"><ShieldCheck size={18} /></span>
              <span>
                <p className="font-bold">Panel de administrador</p>
                <p className="text-xs text-textSecondary">Usuarios registrados y sus ingresos</p>
              </span>
            </span>
            <ArrowRight size={18} className="text-textSecondary" />
          </Link>
          <BaseDatosCard />
        </>
      )}

      <AparienciaCard />

      <NotificacionesCard />

      <CalendarioCard />

      <VersionCard />

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold">
          {sync.enLinea ? <Wifi size={16} /> : <WifiOff size={16} />} Sincronización
        </p>
        <p className="mb-1 text-xs text-textSecondary">
          Estado: <b>{sync.enLinea ? 'con conexión' : 'sin conexión'}</b>
          {' · '}
          {sync.pendientes > 0 ? `${sync.pendientes} cambio(s) por subir` : 'todo sincronizado'}
        </p>
        {sync.ultimaSync && (
          <p className="mb-1 text-xs text-textSecondary">Última sincronización: {new Date(sync.ultimaSync).toLocaleTimeString('es-CO')}</p>
        )}
        <p className="mb-3 text-xs text-textSecondary">
          Workversity guarda tus datos en este dispositivo, así puedes usarla sin internet. Al volver la conexión, todo se sube solo.
        </p>
        <button
          onClick={() => vaciarCola()}
          disabled={sync.sincronizando || !sync.enLinea}
          className="flex w-full items-center justify-center gap-2 rounded-sm2 border border-primary/30 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          <RefreshCw size={15} className={sync.sincronizando ? 'animate-spin' : ''} />
          {sync.sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
        </button>
      </section>

      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-sm2 bg-dangerSoft py-3 text-sm font-bold text-danger">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}
