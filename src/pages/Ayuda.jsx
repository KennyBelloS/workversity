import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, PlayCircle, Users2, GraduationCap } from 'lucide-react';
import RecorridoAnimado from '../components/ayuda/RecorridoAnimado';
import { MapaConjunto } from '../components/ayuda/Ilustraciones';
import GuiaPasoAPaso from '../components/ayuda/GuiaPasoAPaso';
import { leerTabla } from '../offline/db';
import { useSyncEstado } from '../hooks/useSyncEstado';
import NovedadesLista from '../components/NovedadesLista';
import { RELEASES } from '../changelog';
import { VERSION } from '../version';

const FAQ = [
  ['¿Cómo hago mi revisión semanal?', 'Resumen → «Revisión semanal» (o Ctrl + K y escribe «revisión»). Son 4 pasos: tu semana, reprogramar lo vencido, lo que viene y una reflexión. La campana te la recuerda de viernes a domingo.'],
  ['¿Cómo respaldo o restauro mis datos?', 'Ajustes → Copia de seguridad. «Descargar copia» guarda un archivo con todo; «Restaurar copia» lo carga de nuevo (sin borrar nada) en esta u otra cuenta.'],
  ['¿La app se actualiza sola?', 'Sí. Cuando hay una versión nueva se descarga en segundo plano y se instala sola (también si la instalaste como app). Si estás escribiendo, espera a que termines. Después te muestra un reporte de qué cambió; el historial está en esta página.'],
  ['¿Funciona sin internet?', 'Sí. La app guarda tus datos en el dispositivo; lo que hagas sin conexión se sube solo cuando vuelva el internet. Solo iniciar sesión por primera vez requiere conexión.'],
  ['¿Cómo recibo avisos con la app cerrada?', 'Ajustes → Notificaciones → Activar (en cada dispositivo). En iPhone/iPad primero instala la app: Compartir → Añadir a pantalla de inicio. El servidor de avisos debe estar desplegado (ver el manual).'],
  ['¿Cómo calculo mi nota?', 'Asistente → Notas. Cada materia tiene 3 cortes (35 · 35 · 30, editables). Dentro de cada corte agrega las actividades con su porcentaje y, cuando tengas la nota, escríbela: todo se calcula solo, y te dice cuánto necesitas para tu meta.'],
  ['¿Cómo paso mi horario a Google Calendar o al iPhone?', 'Agenda → Calendario. Descarga el .ics para importarlo, o copia el enlace de suscripción para que se actualice solo.'],
  ['¿Por qué mi tarea de universidad pide una materia?', 'Para que el resumen, las notas y el asistente sepan a qué materia pertenece. Si aún no tienes materias, crea la primera en Materias.'],
  ['¿Puedo usarla en varios dispositivos?', 'Sí, con la misma cuenta. Los datos se sincronizan; si editas lo mismo en dos dispositivos, gana el último cambio que llegue.'],
  ['¿Cómo la instalo como app?', 'Chrome/Edge: botón “Instalar” de la barra de direcciones. Android: menú → Instalar app. iPhone/iPad (Safari): Compartir → Añadir a pantalla de inicio. Mac (Safari): Archivo → Añadir al Dock.'],
  ['¿Cómo comparto mi agenda con mi pareja o mis compañeros?', 'Ve a Grupo, crea un espacio y comparte el código de invitación. La otra persona se une con ese código; desde ahí pueden pedirse horarios y comparar puntos. Mira la guía paso a paso más abajo.'],
  ['¿Qué diferencia hay entre admin y miembro en un espacio compartido?', 'Ambos tienen el mismo acceso a las funciones del espacio (pedir horarios, ver la agenda compartida, la tabla de posiciones). El admin, además, puede ascender, degradar o quitar a otras personas del espacio.'],
  ['¿Cómo preparo un parcial con mis apuntes?', 'Ve a Parciales, crea uno y sube una foto, un PDF, un Word o un Excel (o pega el texto). La app genera tarjetas de estudio, un mini test, una simulación de examen, un mapa conceptual y un diagrama de flujo. Mira la guía paso a paso más abajo.'],
];

const GUIA_GRUPO = [
  ['Crea un espacio o pide que te inviten', 'Ve a Grupo (barra inferior → Más → Grupo). Si eres el primero, escribe un nombre (ej: "Ana y Luis") y pulsa Crear: quedas como admin. Si alguien ya te invitó, pídele su código de 6 letras y pégalo en "Unirme con un código".'],
  ['Comparte el código con la otra persona', 'Arriba de la pantalla verás el código de invitación con un botón para copiarlo. Envíaselo por el medio que uses siempre (WhatsApp, mensaje de texto…); ella lo pega en su Workversity y queda dentro del espacio como miembro.'],
  ['Revisa quién está y qué rol tiene', 'En "Miembros" ves a todos con su color y su rol. Como admin puedes ascender a alguien más (Hacer admin), quitarle el rol, o sacarlo del espacio si ya no aplica.'],
  ['Pide un espacio en la agenda', 'Baja hasta "Pedir un espacio en la agenda": escribe qué es (ej: "Salida al cine" o "Estudiar juntos"), para quién es (una persona o todo el grupo), y la fecha y hora. Si ya hay algo agendado a esa hora te avisa, pero puedes enviarla igual.'],
  ['La otra persona la acepta o la rechaza', 'Le llegará en "Solicitudes" con botones Aceptar / Rechazar. En cuanto la aceptan, el plan queda visible para todos en "Agenda compartida", con el color de quien lo propuso.'],
  ['Compara tus puntos', 'En "Tabla de posiciones" ves los puntos de cada quien (los mismos que ya ganas completando tareas, Pomodoros y rachas): es solo para comparar, no le quita puntos a nadie.'],
];
const GUIA_PARCIALES = [
  ['Crea el parcial', 'Ve a Parciales → Nuevo parcial. Ponle un título (ej: "Parcial 2 de Biología"), la materia si aplica, y la fecha del examen: con eso la app calcula cuántos días te quedan y ajusta los consejos.'],
  ['Agrega tus fuentes de estudio', 'En la pestaña Fuentes puedes: subir una foto de tus apuntes (la app lee el texto de la imagen), subir un PDF, un Word (.docx) o un Excel (.xlsx), o simplemente pegar el texto a mano. Todo se procesa en tu propio celular o computador.'],
  ['Revisa las tarjetas que se generaron solas', 'En Tarjetas → "Ver y editar" verás las preguntas y respuestas que la app armó de tus apuntes. Corrige lo que haga falta, borra las que no sirvan, y agrega las tuyas con el formulario de arriba.'],
  ['Estudia con las tarjetas', 'En Tarjetas → "Estudiar" te muestra una tarjeta a la vez: piensa la respuesta, toca la tarjeta para voltearla y dinos si la sabías o no. La app repite primero las que más se te dificultan.'],
  ['Ponte a prueba con el mini test', 'La pestaña Mini test arma preguntas de opción múltiple con tus propias tarjetas. Al final ves tu nota y cuáles fallaste.'],
  ['Haz una simulación completa', 'Cuando ya te sientas listo, la pestaña Simulación arma un examen con todas tus tarjetas, cronometrado, como el día real.'],
  ['Usa el mapa y el diagrama para repasar rápido', 'En "Mapas y diagramas" tienes un mapa conceptual (el tema en el centro y las ideas clave alrededor) y un diagrama de flujo con los pasos del proceso, generados solos de tus apuntes.'],
  ['Sigue los consejos', 'La pestaña Consejos te dice qué hacer según cuántos días falten y cómo te ha ido en los tests: por ejemplo, si vas atrasado te sugiere repasar en sesiones cortas en vez de todo junto la noche anterior.'],
];

const ATAJOS = [['Ctrl + K  ó  /', 'Buscar tareas, materias y secciones'], ['← →', 'Cambiar de lámina en el recorrido'], ['Esc', 'Cerrar ventanas y buscador'], ['Barra inferior', 'Cambiar de sección (en el celular, “Más” guarda el resto)']];

export default function Ayuda() {
  const { version } = useSyncEstado();
  const [hecho, setHecho] = useState({});

  useEffect(() => {
    (async () => {
      const [materias, tareas, evaluaciones, bloques] = await Promise.all([leerTabla('materias'), leerTabla('tareas'), leerTabla('evaluaciones'), leerTabla('bloques_horario')]);
      let push = false;
      try { const reg = await navigator.serviceWorker?.getRegistration(); push = !!(await reg?.pushManager.getSubscription()); } catch { /* nada */ }
      setHecho({
        materias: materias.length > 0, bloques: bloques.length > 0, tareas: tareas.length > 0, notas: evaluaciones.length > 0, push,
        instalada: window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
      });
    })();
  }, [version]);

  const pasos = [
    ['materias', 'Registra tus materias', '/materias'], ['bloques', 'Agrega tu trabajo o reuniones a la agenda', '/horario'], ['tareas', 'Crea tu primera tarea', '/tareas'],
    ['notas', 'Configura las actividades de tus cortes', '/analitica?tab=notas'], ['push', 'Activa las notificaciones', '/configuracion'], ['instalada', 'Instala la app en tu dispositivo', '/configuracion'],
  ];
  const listos = pasos.filter(([k]) => hecho[k]).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Cómo se usa Workversity</h2>
        <p className="text-sm text-textSecondary">Un recorrido animado por cada módulo y por cómo trabajan juntos. Se reproduce solo; pausa o avanza cuando quieras.</p>
      </div>

      <RecorridoAnimado />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md2 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold">Empieza en 6 pasos</p>
            <span className="rounded-full bg-primarySoft px-2.5 py-1 text-xs font-extrabold text-primary">{listos}/{pasos.length}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(listos / pasos.length) * 100}%` }} /></div>
          <ul className="space-y-1.5">
            {pasos.map(([k, txt, ruta]) => (
              <li key={k}>
                <Link to={ruta} className="flex items-center gap-2.5 rounded-sm2 bg-bg px-3 py-2.5 text-sm font-semibold">
                  {hecho[k] ? <CheckCircle2 size={18} className="shrink-0 text-success" /> : <Circle size={18} className="shrink-0 text-textSecondary/50" />}
                  <span className={hecho[k] ? 'text-textSecondary line-through' : ''}>{txt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md2 bg-white p-4 shadow-card">
          <p className="text-sm font-extrabold">Todo conectado</p>
          <p className="mb-2 text-xs text-textSecondary">Registras una vez y la app reparte la información. Toca un módulo.</p>
          <MapaConjunto interactivo />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GuiaPasoAPaso titulo="Guía paso a paso: Grupo (agenda compartida)" icono={Users2} color="#5B8DEF" pasos={GUIA_GRUPO} />
        <GuiaPasoAPaso titulo="Guía paso a paso: Parciales" icono={GraduationCap} color="#8B7FD1" pasos={GUIA_PARCIALES} />
      </div>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-extrabold">Atajos y trucos</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ATAJOS.map(([k, t]) => (<div key={k} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5"><kbd className="shrink-0 rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-bold shadow-card">{k}</kbd><span className="text-xs text-textSecondary">{t}</span></div>))}
        </div>
        <button onClick={() => window.dispatchEvent(new Event('workversity:tour'))} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary"><PlayCircle size={15} /> Ver el recorrido de bienvenida en pantalla completa</button>
      </section>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-1 text-sm font-extrabold">Historial de versiones</p>
        <p className="mb-2 text-xs text-textSecondary">Estás usando la versión {VERSION}. Aquí ves qué cambió en cada actualización.</p>
        <NovedadesLista releases={RELEASES} />
      </section>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-extrabold">Preguntas frecuentes</p>
        <div className="divide-y divide-black/5">
          {FAQ.map(([q, a]) => (<details key={q} className="group py-2.5"><summary className="cursor-pointer list-none text-sm font-bold marker:hidden">{q}</summary><p className="mt-1.5 text-xs leading-relaxed text-textSecondary">{a}</p></details>))}
        </div>
      </section>
    </div>
  );
}
