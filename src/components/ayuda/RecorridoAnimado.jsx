import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight } from 'lucide-react';
import { IlusMaterias, IlusAgenda, IlusTareas, IlusAsistente, IlusNotas, IlusNotificaciones, IlusCalendario, IlusResumen, IlusFinanzas, IlusAtajos, IlusConjunto } from './Ilustraciones';

const DURACION = 9; // segundos por lámina

export const LAMINAS = [
  { id: 'materias', emoji: '📚', titulo: 'Materias: el punto de partida', ruta: '/materias', boton: 'Ir a Materias', Ilus: IlusMaterias,
    resumen: 'Registra cada materia una vez y todo lo demás se conecta solo.',
    pasos: ['Toca “Nueva materia” y escribe nombre, profesor, salón y NRC.', 'Elige el día y la hora (si tiene varios días, agrégala una vez por día).', 'Actívala como “virtual” si es en línea: pones el enlace en vez del salón.', 'Listo: aparece automáticamente en tu Agenda, en las tareas y en las notas.'] },
  { id: 'agenda', emoji: '🗓️', titulo: 'Agenda: todo en un solo lugar', ruta: '/horario', boton: 'Ir a la Agenda', Ilus: IlusAgenda,
    resumen: 'Clases, trabajo, reuniones y tareas juntos, en semana o en lista.',
    pasos: ['Ves tus clases, tus turnos de trabajo, reuniones y las fechas de entrega.', 'Filtra por tipo con los botones de colores y cambia de semana con las flechas.', 'Usa “Nuevo” para agregar trabajo, reuniones u otros bloques semanales.', 'La línea roja marca la hora actual; toca una tarea para completarla.'] },
  { id: 'tareas', emoji: '✅', titulo: 'Tareas: con materia y captura rápida', ruta: '/tareas', boton: 'Ir a Tareas', Ilus: IlusTareas,
    resumen: 'Cada tarea de universidad se asocia a una materia; muévelas por el tablero.',
    pasos: ['En el Dashboard escribe una frase: “informe de física mañana 5pm !alta”.', 'O usa “Nueva tarea”: la de universidad pide la materia; la de trabajo no.', 'Arrastra la tarjeta (o usa “Mover a…”) entre Por hacer, En progreso y Hecha.', 'Mira la vista “Materias” para ver lo pendiente de cada una.'] },
  { id: 'asistente', emoji: '✨', titulo: 'Asistente: qué hacer y cuándo', ruta: '/analitica', boton: 'Ir al Asistente', Ilus: IlusAsistente,
    resumen: 'Prioriza por ti y aprovecha tus huecos libres.',
    pasos: ['“Plan” ordena tus tareas por urgencia y prioridad, y te sugiere en qué hueco hacer cada una.', 'La matriz separa lo urgente de lo importante.', '“Enfoque” tiene Pomodoro y tu registro de energía.', '“Trabajos” divide entregas grandes en etapas y arma tus referencias APA.', '“Hábitos” muestra lo que la app aprende de ti y lo usa para ajustar tus sugerencias.'] },
  { id: 'notas', emoji: '🎓', titulo: 'Notas por cortes, calculadas solas', ruta: '/analitica?tab=notas', boton: 'Ir a Notas', Ilus: IlusNotas,
    resumen: 'Tres cortes (35 · 35 · 30) con actividades y porcentajes.',
    pasos: ['Cada materia tiene 3 cortes; cambia sus pesos si tu universidad usa otros.', 'En cada corte agrega actividades y cuánto vale cada una (suman 100% del corte).', 'Si una actividad son varios talleres o quices, desglósala: todos valen igual y se promedian.', 'Escribe la nota (3.5 o 35) y pulsa Guardar: el corte y la final se calculan, y te dice si vas ganando o perdiendo (se pierde bajo 3.0).'] },
  { id: 'avisos', emoji: '🔔', titulo: 'Avisos que llegan a tiempo', ruta: '/configuracion', boton: 'Activar avisos', Ilus: IlusNotificaciones,
    resumen: 'Campana dentro de la app y notificaciones con la app cerrada.',
    pasos: ['La campana de arriba muestra lo vencido, lo próximo y las materias en riesgo.', 'En Ajustes activa las notificaciones para recibirlas aunque la app esté cerrada.', 'Recibes aviso antes de cada tarea, clase o reunión y un resumen cada mañana.', 'En iPhone, primero instala la app (Compartir → Añadir a pantalla de inicio).'] },
  { id: 'calendario', emoji: '📅', titulo: 'Llévalo a tu calendario', ruta: '/horario', boton: 'Ir a la Agenda', Ilus: IlusCalendario,
    resumen: 'Google Calendar, iPhone u Outlook, con alarmas incluidas.',
    pasos: ['En Agenda toca “Calendario”.', 'Descarga el archivo .ics para importarlo una vez, con clases semanales y tareas.', 'O suscríbete con el enlace secreto para que se actualice sola.', 'Cada evento trae su alarma, así tu celular también te avisa.'] },
  { id: 'resumen', emoji: '📊', titulo: 'Resumen: tu semana en un vistazo', ruta: '/resumen', boton: 'Ir al Resumen', Ilus: IlusResumen,
    resumen: 'Semana o mes: tareas, enfoque, dinero, notas y avance por materia.',
    pasos: ['Cambia entre Semana y Mes y navega a periodos anteriores.', 'Mira cumplimiento, racha, horas de enfoque y frases con tus datos.', 'La tabla por materia muestra activas, vencidas, progreso y nota.', '“Copiar resumen” lo pega en un mensaje; “Imprimir” lo guarda en PDF.'] },
  { id: 'finanzas', emoji: '💰', titulo: 'Finanzas y metas de ahorro', ruta: '/finanzas', boton: 'Ir a Finanzas', Ilus: IlusFinanzas,
    resumen: 'Ingresos, gastos y ahorro del mes contra tu presupuesto.',
    pasos: ['Registra ingresos, gastos y ahorros con su categoría.', 'Fija un presupuesto mensual y mira cuánto llevas gastado.', 'En Metas define objetivos de ahorro o de progreso (leer un libro, un curso…), crea tus propias categorías y registra avances.', 'Todo alimenta el Resumen y el balance del Dashboard.'] },
  { id: 'atajos', emoji: '⌨️', titulo: 'Atajos, instalación y sin internet', ruta: '/configuracion', boton: 'Ver Ajustes', Ilus: IlusAtajos,
    resumen: 'Úsala como una app nativa en cualquier dispositivo.',
    pasos: ['Ctrl + K (o “/”) busca tareas, materias y secciones al instante.', 'La barra de abajo cambia de sección; en el celular “Más” guarda el resto.', 'Instálala desde el navegador (botón “Instalar” o Compartir → Añadir a inicio).', 'Sin internet sigue funcionando y sincroniza al volver la conexión.'] },
  { id: 'conjunto', emoji: '🧩', titulo: 'Cómo funciona todo en conjunto', ruta: '/', boton: 'Ir al Dashboard', Ilus: IlusConjunto,
    resumen: 'Registras una vez; la app conecta el resto.',
    pasos: ['Las materias alimentan la agenda, las tareas y las notas.', 'Las tareas y la agenda generan avisos y se exportan a tu calendario.', 'El asistente usa tus tareas y notas para priorizar.', 'El resumen junta todo para que revises tu avance.'] },
];

export default function RecorridoAnimado({ compacto = false, onFin }) {
  const [i, setI] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [pausaHover, setPausaHover] = useState(false);
  const raiz = useRef(null);
  const L = LAMINAS[i];
  const ir = (n) => setI((n + LAMINAS.length) % LAMINAS.length);
  const siguiente = () => { if (i === LAMINAS.length - 1 && onFin) onFin(); else ir(i + 1); };

  useEffect(() => {
    const tecla = (e) => {
      if (!raiz.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.key === 'ArrowRight') ir(i + 1);
      if (e.key === 'ArrowLeft') ir(i - 1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });  

  const corriendo = reproduciendo && !pausaHover;
  return (
    <div ref={raiz} onMouseEnter={() => setPausaHover(true)} onMouseLeave={() => setPausaHover(false)} onFocus={() => setPausaHover(true)} onBlur={() => setPausaHover(false)} className="overflow-hidden rounded-lg2 bg-white shadow-card">
      <div className="flex gap-1 px-4 pt-4">
        {LAMINAS.map((l, k) => (
          <button key={l.id} onClick={() => ir(k)} aria-label={`Ir a ${l.titulo}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
            {k < i && <span className="block h-full w-full bg-primary" />}
            {k === i && <span key={`${i}-${reproduciendo}`} onAnimationEnd={corriendo ? siguiente : undefined} className="anim-progress block h-full w-full bg-primary" style={{ animationDuration: `${DURACION}s`, animationPlayState: corriendo ? 'running' : 'paused' }} />}
          </button>
        ))}
      </div>

      <div key={i} className={`grid gap-4 p-4 ${compacto ? '' : 'lg:grid-cols-2 lg:gap-6 lg:p-6'}`}>
        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-bold text-primary">{L.emoji} Paso {i + 1} de {LAMINAS.length}</p>
          <h3 className={`mt-1 font-extrabold tracking-tight ${compacto ? 'text-lg' : 'text-xl sm:text-2xl'}`}>{L.titulo}</h3>
          <p className="mt-1 text-sm text-textSecondary">{L.resumen}</p>
          <ol className="mt-3 space-y-2">
            {L.pasos.map((p, k) => (
              <li key={p} className="anim-step flex gap-2.5 text-[13px]" style={{ animationDelay: `${0.4 + k * 1.6}s` }}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primarySoft text-[10px] font-extrabold text-primary">{k + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
          {!compacto && <Link to={L.ruta} className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">{L.boton} <ArrowRight size={13} /></Link>}
        </div>
        <div className={`overflow-hidden rounded-2xl border border-black/5 bg-primarySoft/50 ${compacto ? 'h-56' : 'h-64 lg:h-auto lg:min-h-[19rem]'}`}><L.Ilus /></div>
      </div>

      <div className="flex items-center justify-between border-t border-black/5 px-4 py-3">
        <button onClick={() => setReproduciendo((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-xs font-bold text-textSecondary" aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
          {reproduciendo ? <Pause size={13} /> : <Play size={13} />} {reproduciendo ? 'Pausar' : 'Reproducir'}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => ir(i - 1)} aria-label="Anterior" className="rounded-full bg-bg p-2 text-textSecondary"><ChevronLeft size={16} /></button>
          <button onClick={siguiente} aria-label="Siguiente" className="rounded-full bg-primary p-2 text-white"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
