import { useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { Link } from 'react-router-dom';
import { LogOut, KeyRound, User, RefreshCw, Wifi, WifiOff, ShieldCheck, RotateCw } from 'lucide-react';
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
import Franja from '../components/layout/Franja';
import { recargarApp } from '../lib/arranque';
import SemestresCard from '../components/config/SemestresCard';

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

  // Índice de la izquierda: las mismas secciones que hay a la derecha, para no tener que bajar a ciegas.
  const indice = [['cuenta', 'Cuenta'], ['apariencia', 'Apariencia'], ['avisos', 'Avisos'], ['datos', 'Datos'], ['app', 'La app']];

  return (
    <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[164px_minmax(0,620px)]">
      <nav className="hidden lg:block">
        <div className="sticky top-24 space-y-1.5">
          {indice.map(([id, t], k) => (
            <a key={id} href={`#aj-${id}`} className="flex items-baseline gap-2.5 py-1 text-t-pie text-textSecondary transition hover:text-textPrimary">
              <span className="font-mono text-t-micro text-primary">{String(k + 1).padStart(2, '0')}</span>{t}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-4">
        {mensaje && <p className="rounded-[12px] bg-primarySoft px-4 py-2.5 text-t-pie font-medium text-primary">{mensaje}</p>}

        <section id="aj-cuenta" className="scroll-mt-24 space-y-3">
          <Franja n="01">Cuenta</Franja>
          <div className="ficha">
            <div className="ficha-cabecera"><span className="rotulo"><User size={12} className="mr-1 inline" /> Perfil</span><span className="franja-acc">{usuario?.email}</span></div>
            <div className="flex gap-2">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Tu nombre" className="campo flex-1" />
              <button onClick={guardarNombre} disabled={guardandoNombre} className="boton-ppal">Guardar</button>
            </div>
          </div>
          <div className="ficha">
            <div className="ficha-cabecera"><span className="rotulo"><KeyRound size={12} className="mr-1 inline" /> Contraseña</span></div>
            <div className="flex gap-2">
              <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Nueva contraseña" className="campo flex-1" />
              <button onClick={cambiarPassword} disabled={guardandoPassword} className="boton-ppal">Cambiar</button>
            </div>
          </div>
          {perfil?.es_admin && (
            <div className="ficha">
              <div className="ficha-cabecera"><span className="rotulo"><ShieldCheck size={12} className="mr-1 inline" /> Administrador</span></div>
              <p className="mb-3 text-t-pie text-textSecondary">Tu cuenta puede ver y gestionar a todos los usuarios de la app.</p>
              <Link to="/admin" className="boton-ppal">Abrir panel de administrador</Link>
            </div>
          )}
        </section>

        <section id="aj-apariencia" className="scroll-mt-24 space-y-3">
          <Franja n="02">Apariencia</Franja>
          <AparienciaCard />
        </section>

        <section id="aj-avisos" className="scroll-mt-24 space-y-3">
          <Franja n="03">Avisos</Franja>
          <NotificacionesCard />
          <CalendarioCard />
        </section>

        <section id="aj-datos" className="scroll-mt-24 space-y-3">
          <Franja n="04">Datos</Franja>
          <SemestresCard />
          <RespaldoCard />
          <div className="ficha">
            <div className="ficha-cabecera">
              <span className="rotulo">{sync.enLinea ? <Wifi size={12} className="mr-1 inline" /> : <WifiOff size={12} className="mr-1 inline" />} Sincronización</span>
              <span className="franja-acc">{sync.enLinea ? 'con conexión' : 'sin conexión'}</span>
            </div>
            <p className="text-t-pie text-textSecondary">
              {sync.pendientes > 0 ? `${sync.pendientes} cambio(s) por subir` : 'Todo sincronizado'}
              {sync.ultimaSync ? ` · última a las ${new Date(sync.ultimaSync).toLocaleTimeString('es-CO')}` : ''}
            </p>
            <p className="mt-1.5 text-t-micro leading-relaxed text-textSecondary">
              Workversity guarda tus datos en este dispositivo, así puedes usarla sin internet. Al volver la conexión, todo se sube solo.
            </p>
            <button onClick={() => vaciarCola()} disabled={sync.sincronizando || !sync.enLinea} className="boton-secundario mt-3 w-full justify-center">
              <RefreshCw size={14} className={sync.sincronizando ? 'animate-spin' : ''} />
              {sync.sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
          </div>
          {perfil?.es_admin && <BaseDatosCard /> /* lo de la base de datos es cosa de quien administra */}
        </section>

        <section id="aj-app" className="scroll-mt-24 space-y-3">
          <Franja n="05">La app</Franja>
          <VersionCard />
          <div className="ficha">
            <div className="ficha-cabecera"><span className="rotulo"><RotateCw size={12} className="mr-1 inline" /> Recargar</span></div>
            <p className="text-t-pie text-textSecondary">Vuelve a abrir Workversity y busca la versión más nueva. Útil si algo se quedó pegado.</p>
            <button onClick={() => recargarApp()} className="boton-secundario mt-3 w-full justify-center"><RotateCw size={14} /> Recargar la app</button>
          </div>
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-dangerSoft py-3 text-t-pie font-medium text-danger transition hover:bg-danger hover:text-white">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </section>
      </div>
    </div>
  );
}
