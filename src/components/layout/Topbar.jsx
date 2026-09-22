import { Link } from 'react-router-dom';
import { LogOut, Sun, Moon, Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTema, elegirTema } from '../../hooks/useTema';
import CentroNotificaciones from './CentroNotificaciones';
import Logo from '../Logo';

const boton = 'rounded-full p-2 text-textSecondary hover:bg-black/5 hover:text-textPrimary';

export default function Topbar({ titulo }) {
  const { perfil, usuario, logout } = useAuth();
  const { oscuro } = useTema();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-bg/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" aria-label="Ir al inicio"><Logo tam={38} /></Link>
        <div className="min-w-0">
          <p className="hidden text-[11px] font-bold leading-none text-textSecondary sm:block">Workversity</p>
          <h1 className="truncate text-base font-extrabold text-textPrimary sm:text-lg">{titulo}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <button onClick={() => window.dispatchEvent(new Event('workversity:paleta'))} aria-label="Buscar" title="Buscar (Ctrl + K)" className="flex items-center gap-2 rounded-full p-2 text-textSecondary hover:bg-black/5 md:bg-white md:px-3.5 md:shadow-card">
          <Search size={17} /><span className="hidden text-xs font-semibold md:inline">Buscar</span><kbd className="hidden rounded bg-bg px-1.5 py-0.5 text-[10px] font-bold lg:inline">Ctrl K</kbd>
        </button>
        <Link to="/ayuda" title="Cómo se usa" aria-label="Cómo se usa" className={`${boton} hidden sm:block`}><HelpCircle size={18} /></Link>
        <CentroNotificaciones />
        <button onClick={() => elegirTema(oscuro ? 'claro' : 'oscuro')} title={oscuro ? 'Modo claro' : 'Modo oscuro'} aria-label="Cambiar tema" className={boton}>
          {oscuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="mx-1 hidden max-w-[10rem] truncate text-sm font-semibold text-textSecondary lg:block">{perfil?.nombre || usuario?.email}</span>
        <button onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión" className={`${boton} hover:text-danger`}><LogOut size={18} /></button>
      </div>
    </header>
  );
}
