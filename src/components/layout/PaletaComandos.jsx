import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, LayoutDashboard, CalendarClock, KanbanSquare, Wallet, BookOpen, Sparkles, BarChart3, Target, Settings, HelpCircle, Moon, FileText, GraduationCap, CalendarCheck, Trophy, NotebookPen, Users2 } from 'lucide-react';
import { leerTabla } from '../../offline/db';
import { elegirTema, useTema } from '../../hooks/useTema';

const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const PAGINAS = [
  { to: '/', t: 'Dashboard', k: 'inicio captura rapida', i: LayoutDashboard },
  { to: '/horario', t: 'Agenda', k: 'horario semana calendario clases', i: CalendarClock },
  { to: '/tareas', t: 'Tareas', k: 'pendientes entregas tablero', i: KanbanSquare },
  { to: '/materias', t: 'Materias', k: 'clases profesor salon', i: BookOpen },
  { to: '/finanzas', t: 'Finanzas', k: 'dinero gastos ingresos presupuesto', i: Wallet },
  { to: '/metas', t: 'Metas (ahorro y progreso)', k: 'ahorro leer libro lectura progreso estudio ejercicio curso', i: Target },
  { to: '/parciales', t: 'Parciales (tarjetas, tests, mapas)', k: 'parcial examen estudiar tarjetas flashcards quiz simulacro mapa conceptual diagrama flujo', i: NotebookPen },
  { to: '/grupo', t: 'Grupo (agenda compartida)', k: 'grupo pareja compartir agenda espacio codigo invitacion puntos', i: Users2 },
  { to: '/?revision=1', t: 'Hacer mi revisión semanal', k: 'revision semanal vencidas reprogramar cierre', i: CalendarCheck },
  { to: '/resumen', t: 'Logros', k: 'logros insignias trofeos racha', i: Trophy },
  { to: '/resumen', t: 'Resumen', k: 'semana mes reporte tablero', i: BarChart3 },
  { to: '/analitica?tab=plan', t: 'Asistente: plan y prioridades', k: 'que hago ahora eisenhower huecos', i: Sparkles },
  { to: '/analitica?tab=trabajos', t: 'Ayuda para trabajos y referencias APA', k: 'apa ensayo informe planificador', i: FileText },
  { to: '/analitica?tab=notas', t: 'Notas y cortes', k: 'calificaciones calculadora promedio', i: GraduationCap },
  { to: '/analitica?tab=habitos', t: 'Hábitos: lo que la app aprende de ti', k: 'aprendizaje habitos productividad rendimiento', i: Sparkles },
  { to: '/configuracion', t: 'Ajustes y notificaciones', k: 'configuracion calendario tema', i: Settings },
  { to: '/ayuda', t: 'Cómo se usa', k: 'ayuda tutorial guia', i: HelpCircle },
];

export default function PaletaComandos() {
  const navigate = useNavigate();
  const { oscuro } = useTema();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const [datos, setDatos] = useState({ tareas: [], materias: [] });
  const input = useRef(null);

  useEffect(() => {
    const tecla = (e) => {
      const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAbierto((v) => !v); }
      else if (e.key === '/' && !enCampo && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setAbierto(true); }
      else if (e.key === 'Escape') setAbierto(false);
    };
    const abrir = () => setAbierto(true);
    window.addEventListener('keydown', tecla);
    window.addEventListener('workversity:paleta', abrir);
    return () => { window.removeEventListener('keydown', tecla); window.removeEventListener('workversity:paleta', abrir); };
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setQ(''); setIdx(0);
    Promise.all([leerTabla('tareas'), leerTabla('materias')]).then(([tareas, materias]) => setDatos({ tareas, materias }));
    setTimeout(() => input.current?.focus(), 30);
  }, [abierto]);

  const items = useMemo(() => {
    const n = norm(q);
    const coincide = (...c) => !n || c.some((x) => norm(x).includes(n));
    const nombresMaterias = new Map(datos.materias.map((m) => [m.id, m.nombre]));
    const lista = [];
    PAGINAS.filter((p) => coincide(p.t, p.k)).slice(0, n ? 6 : 12).forEach((p) => lista.push({ grupo: 'Ir a', titulo: p.t, icono: p.i, accion: () => navigate(p.to) }));
    datos.tareas
      .filter((t) => coincide(t.title, nombresMaterias.get(t.materia_id)))
      .sort((a, b) => (a.status === 'hecha') - (b.status === 'hecha') || new Date(a.due_date) - new Date(b.due_date))
      .slice(0, n ? 6 : 0)
      .forEach((t) => lista.push({ grupo: 'Tareas', titulo: t.title, sub: `${nombresMaterias.get(t.materia_id) || (t.category === 'trabajo' ? 'Trabajo' : 'Universidad')} · ${new Date(t.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}${t.status === 'hecha' ? ' · hecha' : ''}`, icono: KanbanSquare, accion: () => navigate('/tareas') }));
    [...new Set(datos.materias.map((m) => m.nombre))].filter((nm) => coincide(nm)).slice(0, n ? 4 : 0).forEach((nm) => lista.push({ grupo: 'Materias', titulo: nm, icono: BookOpen, accion: () => navigate('/materias') }));
    if (coincide('modo oscuro claro tema')) lista.push({ grupo: 'Acciones', titulo: oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro', icono: Moon, accion: () => elegirTema(oscuro ? 'claro' : 'oscuro') });
    return lista;
  }, [q, datos, navigate, oscuro]);

  useEffect(() => { setIdx(0); }, [q]);
  if (!abierto) return null;

  const ejecutar = (it) => { setAbierto(false); it?.accion(); };
  const alTeclear = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); ejecutar(items[idx]); }
  };

  let grupoPrevio = '';
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-3 pt-[10vh]" onClick={() => setAbierto(false)} role="dialog" aria-label="Buscar">
      <div className="w-full max-w-lg overflow-hidden rounded-lg2 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
          <Search size={18} className="text-textSecondary" />
          <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={alTeclear} placeholder="Busca una tarea, materia o sección…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <kbd className="rounded bg-bg px-1.5 py-0.5 text-[10px] font-bold text-textSecondary">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <p className="py-8 text-center text-sm text-textSecondary">Nada coincide con “{q}”</p>}
          {items.map((it, i) => {
            const mostrar = it.grupo !== grupoPrevio; grupoPrevio = it.grupo;
            return (
              <div key={`${it.grupo}-${it.titulo}-${i}`}>
                {mostrar && <p className="px-2 pb-1 pt-2 text-[11px] font-bold text-textSecondary">{it.grupo}</p>}
                <button onClick={() => ejecutar(it)} onMouseEnter={() => setIdx(i)} className={`flex w-full items-center gap-3 rounded-sm2 px-3 py-2 text-left ${i === idx ? 'bg-primarySoft' : ''}`}>
                  <it.icono size={16} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{it.titulo}</span>{it.sub && <span className="block truncate text-[11px] text-textSecondary">{it.sub}</span>}</span>
                  {i === idx && <CornerDownLeft size={14} className="text-textSecondary" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 border-t border-black/5 px-4 py-2 text-[11px] text-textSecondary"><span>↑↓ moverte</span><span>Enter abrir</span><span className="ml-auto">Ctrl + K o / para abrir</span></div>
      </div>
    </div>
  );
}
