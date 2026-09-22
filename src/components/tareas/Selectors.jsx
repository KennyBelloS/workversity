import { LayoutGrid, CalendarDays, CalendarRange, Calendar, BookOpen } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';

const OPCIONES = [
  { value: 'tablero', label: 'Tablero', icon: LayoutGrid },
  { value: 'materias', label: 'Materias', icon: BookOpen },
  { value: 'dia', label: 'Día', icon: CalendarDays },
  { value: 'semana', label: 'Semana', icon: CalendarRange },
  { value: 'mes', label: 'Mes', icon: Calendar },
];

export function ViewSelector({ value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-card">
      {OPCIONES.map((o) => {
        const Icono = o.icon;
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition ${
              sel ? 'bg-primary text-white' : 'text-textSecondary hover:bg-black/5'
            }`}
          >
            <Icono size={14} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterTabs({ value, onChange }) {
  const opciones = [
    { key: null, label: 'Unidos', color: '#6FA8DC' },
    { key: 'universidad', label: CATEGORIES.universidad.label, color: CATEGORIES.universidad.color },
    { key: 'trabajo', label: CATEGORIES.trabajo.label, color: CATEGORIES.trabajo.color },
  ];
  return (
    <div className="flex gap-2">
      {opciones.map((o) => {
        const sel = value === o.key;
        return (
          <button
            key={o.label}
            onClick={() => onChange(o.key)}
            className="flex-1 rounded-full border py-2.5 text-xs font-bold transition"
            style={{
              backgroundColor: sel ? o.color : 'transparent',
              borderColor: sel ? o.color : 'rgba(0,0,0,0.08)',
              color: sel ? 'white' : '#6E7180',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
