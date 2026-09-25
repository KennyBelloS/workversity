import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, KanbanSquare, Wallet, BookOpen, Sparkles, BarChart3, Target, Settings, HelpCircle, MoreHorizontal, GraduationCap, Users2, NotebookPen } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const TODOS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true, primario: true },
  { to: '/horario', label: 'Agenda', icon: CalendarClock, primario: true },
  { to: '/tareas', label: 'Tareas', icon: KanbanSquare, primario: true },
  { to: '/materias', label: 'Materias', icon: BookOpen, primario: true },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, primario: true },
  { to: '/analitica', label: 'Asistente', icon: Sparkles },
  { to: '/resumen', label: 'Resumen', icon: BarChart3 },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/parciales', label: 'Parciales', icon: GraduationCap },
  { to: '/grupo', label: 'Grupo', icon: Users2 },
  { to: '/apuntes', label: 'Apuntes', icon: NotebookPen },
  { to: '/configuracion', label: 'Ajustes', icon: Settings },
  { to: '/ayuda', label: 'Cómo se usa', icon: HelpCircle },
];

function Boton({ icon: Icono, label, activo, ...props }) {
  return (
    <span className={`flex min-w-[3.6rem] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[10px] font-bold transition sm:min-w-[4.1rem] sm:text-[11px] ${activo ? 'text-primary' : 'text-textSecondary hover:text-textPrimary'}`} {...props}>
      <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${activo ? 'bg-primarySoft' : ''}`}><Icono size={19} /></span>
      <span className="max-w-[4.6rem] truncate">{label}</span>
    </span>
  );
}

/**
 * Barra de navegación inferior, tipo app móvil, en todos los tamaños:
 *  • celular: barra pegada abajo con 5 secciones + "Más"
 *  • tablet: barra flotante centrada, mismas secciones
 *  • computador (≥1024 px): barra flotante con todas las secciones
 */
export default function DockNav() {
  const ancha = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();
  const [mas, setMas] = useState(false);
  const visibles = ancha ? TODOS : TODOS.filter((i) => i.primario);
  const extra = TODOS.filter((i) => !i.primario);
  const enExtra = extra.some((i) => pathname.startsWith(i.to));

  useEffect(() => { setMas(false); }, [pathname]);
  useEffect(() => {
    if (!mas) return undefined;
    const esc = (e) => e.key === 'Escape' && setMas(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mas]);

  return (
    <>
      {mas && !ancha && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMas(false)} />}
      {mas && !ancha && (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl sm:bottom-24">
          {extra.map((i) => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => `flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-bold ${isActive ? 'bg-primarySoft text-primary' : 'bg-bg text-textSecondary'}`}>
              <i.icon size={20} /> {i.label}
            </NavLink>
          ))}
        </div>
      )}

      <nav
        aria-label="Navegación principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-1.5rem)] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:border-black/10 sm:shadow-xl"
      >
        <div className="flex items-stretch justify-around gap-0.5 overflow-x-auto px-1 py-1 sm:gap-1 sm:px-2">
          {visibles.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className="outline-none">
              {({ isActive }) => <Boton icon={i.icon} label={i.label} activo={isActive} />}
            </NavLink>
          ))}
          {!ancha && (
            <button onClick={() => setMas((v) => !v)} aria-expanded={mas} aria-label="Más secciones" className="outline-none">
              <Boton icon={MoreHorizontal} label="Más" activo={mas || enExtra} />
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
