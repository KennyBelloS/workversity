import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarClock,
  Wallet,
  BookOpen,
  Target,
  Settings,
  Sparkles,
  BarChart3,
  X,
} from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/resumen', label: 'Resumen', icon: BarChart3 },
  { to: '/tareas', label: 'Tareas', icon: KanbanSquare },
  { to: '/horario', label: 'Agenda', icon: CalendarClock },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/analitica', label: 'Asistente', icon: Sparkles },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ abierto, onCerrar }) {
  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onCerrar} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-white shadow-card transition-transform lg:static lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">
              W
            </div>
            <span className="text-lg font-extrabold text-textPrimary">Workversity</span>
          </div>
          <button onClick={onCerrar} className="rounded-full p-1.5 hover:bg-black/5 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm2 px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primarySoft text-primary'
                    : 'text-textSecondary hover:bg-black/5 hover:text-textPrimary'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
