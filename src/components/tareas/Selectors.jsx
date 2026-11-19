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
    <div className="seg overflow-x-auto">
      {OPCIONES.map((o) => {
        const Icono = o.icon;
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`seg-op ${sel ? 'activo' : ''}`}
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
    { key: null, label: 'Todas', color: null },
    { key: 'universidad', label: CATEGORIES.universidad.label, color: CATEGORIES.universidad.color },
    { key: 'trabajo', label: CATEGORIES.trabajo.label, color: CATEGORIES.trabajo.color },
  ];
  return (
    <div className="seg">
      {opciones.map((o) => (
        <button key={o.label} onClick={() => onChange(o.key)} className={`seg-op ${value === o.key ? 'activo' : ''}`}>
          {o.color && <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: o.color }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
