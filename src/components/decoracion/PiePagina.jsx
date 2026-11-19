import { Link } from 'react-router-dom';
import { HelpCircle, Settings, Users, CalendarDays } from 'lucide-react';
import Logo from '../Logo';
import PaisajeVivo from './PaisajeVivo';
import { VERSION } from '../../version';

// Pie de página con el paisaje vivo (referencia: pie de página de lago ilustrado). Columnas de
// enlaces arriba y, debajo, la ilustración en el color de acento que sube por las esquinas.
const COLUMNAS = [
  ['Organiza', [['Tareas', '/tareas'], ['Agenda', '/horario'], ['Materias', '/materias'], ['Apuntes', '/apuntes']]],
  ['Estudia', [['Parciales', '/parciales'], ['Asistente', '/analitica'], ['Resumen', '/resumen'], ['Metas', '/metas']]],
  ['Tu cuenta', [['Ajustes', '/configuracion'], ['Grupo', '/grupo'], ['Cómo se usa', '/ayuda'], ['Finanzas', '/finanzas']]],
];

export default function PiePagina() {
  return (
    <footer className="pie">
      <div className="pie-contenido">
        <div className="max-w-[300px]">
          <p className="flex items-center gap-2.5"><Logo tam={26} /><span className="pie-marca">Workversity</span></p>
          <p className="mt-3 text-t-pie leading-relaxed text-textSecondary">Tareas, horario, notas y finanzas: la semana de universidad y trabajo, en un solo lugar y sin conexión.</p>
          <div className="mt-4 flex gap-3 text-textSecondary">
            {[[HelpCircle, '/ayuda', 'Cómo se usa'], [CalendarDays, '/horario', 'Agenda'], [Users, '/grupo', 'Grupo'], [Settings, '/configuracion', 'Ajustes']].map(([Icono, to, t]) => (
              <Link key={to} to={to} aria-label={t} className="transition hover:text-textPrimary"><Icono size={15} strokeWidth={1.7} /></Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 sm:gap-12">
          {COLUMNAS.map(([titulo, enlaces]) => (
            <div key={titulo}>
              <p className="text-t-pie font-medium">{titulo}</p>
              <ul className="mt-2.5 space-y-1.5">
                {enlaces.map(([t, to]) => <li key={to}><Link to={to} className="text-t-pie text-textSecondary transition hover:text-textPrimary">{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="pie-legal">
        <span>© {new Date().getFullYear()} Workversity. Hecho para estudiantes que trabajan.</span>
        <span className="font-mono">v{VERSION}</span>
      </div>
      <div className="pie-paisaje"><PaisajeVivo /></div>
    </footer>
  );
}
