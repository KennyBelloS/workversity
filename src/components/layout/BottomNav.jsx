import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, KanbanSquare, Wallet, BookOpen } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/horario', label: 'Agenda', icon: CalendarClock },
  { to: '/tareas', label: 'Tareas', icon: KanbanSquare },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
];

// Barra inferior tipo app nativa (solo en pantallas pequeñas)
export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition ${isActive ? 'text-primary' : 'text-textSecondary'}`}
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-primarySoft' : ''}`}><item.icon size={19} /></span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
