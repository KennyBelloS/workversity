import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, Sun, Moon, Search, HelpCircle, RotateCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTema, elegirTema } from '../../hooks/useTema';
import CentroNotificaciones from './CentroNotificaciones';
import Logo from '../Logo';
import AranaDashboard from '../decoracion/AranaDashboard';
import { recargarApp } from '../../lib/arranque';

const boton = 'rounded-full p-2 text-textSecondary hover:bg-black/5 hover:text-textPrimary';

export default function Topbar({ titulo }) {
  const { logout } = useAuth();
  const [recargando, setRecargando] = useState(false);
  const recargar = () => { setRecargando(true); recargarApp(); };
  const { oscuro } = useTema();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-bg/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
      {/* En el Dashboard, la araña vive en la esquina de la ventana, justo debajo de esta barra. */}
      {pathname === '/' && <AranaDashboard tono={oscuro ? 'claro' : 'oscuro'} />}
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" aria-label="Ir al inicio" className="flex items-center gap-2.5"><Logo tam={30} /><span className="hidden text-t-base font-semibold tracking-[-0.03em] sm:inline">Workversity</span></Link>
        <div className="flex min-w-0 items-center gap-2 font-mono text-t-micro text-textSecondary">
          <span className="text-textPrimary/25">/</span>
          <span className="truncate text-textPrimary">{titulo.toLowerCase()}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <button onClick={() => window.dispatchEvent(new Event('workversity:paleta'))} aria-label="Buscar" title="Buscar (Ctrl + K)" className="flex items-center gap-2 rounded-full p-2 text-textSecondary hover:bg-black/5 md:bg-surface md:px-3.5 md:ring-1 md:ring-textPrimary/5">
          <Search size={15} strokeWidth={1.8} /><span className="hidden text-xs md:inline">Buscar</span><kbd className="hidden rounded-md bg-bg px-1.5 py-0.5 font-mono text-t-nota lg:inline">⌘K</kbd>
        </button>
        <Link to="/ayuda" title="Cómo se usa" aria-label="Cómo se usa" className={`${boton} hidden sm:block`}><HelpCircle size={18} /></Link>
        <CentroNotificaciones />
        <button onClick={recargar} disabled={recargando} title="Recargar la app (busca la versión nueva)" aria-label="Recargar la app" className={boton}>
          <RotateCw size={17} strokeWidth={1.8} className={recargando ? 'animate-spin' : ''} />
        </button>
        {/* Tema, nombre y salida viven en el pie de la barra lateral cuando hay barra lateral. */}
        <button onClick={() => elegirTema(oscuro ? 'claro' : 'oscuro')} title={oscuro ? 'Modo claro' : 'Modo oscuro'} aria-label="Cambiar tema" className={`${boton} lg:hidden`}>
          {oscuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión" className={`${boton} hover:text-danger lg:hidden`}><LogOut size={18} /></button>
      </div>
    </header>
  );
}
