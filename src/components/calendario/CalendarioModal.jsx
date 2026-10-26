import { useEffect, useMemo, useState } from 'react';
import { useEscape } from '../../hooks/useEscape';
import { X, Download, Copy, Check, RefreshCw, CalendarPlus, Smartphone, Share2, ChevronDown, CheckCircle2, Loader2, CalendarDays, MousePointerClick } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leerTabla } from '../../offline/db';
import { actualizarPerfil } from '../../services/auth';
import { supabaseUrl } from '../../services/supabase';
import { nuevoId } from '../../offline/repositorio';
import { generarICS, enlaceGoogle } from '../../../supabase/functions/_shared/ics.js';

const zonaLocal = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';
const esIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Próxima fecha (a la hora dada) en que cae ese día de la semana (1 = lunes … 7 = domingo)
function proxima(dow, minutos) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((dow - (((d.getDay() + 6) % 7) + 1) + 7) % 7));
  d.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return d;
}

export default function CalendarioModal({ onCerrar }) {
  useEscape(onCerrar);
  const { usuario, perfil, refrescarPerfil } = useAuth();
  const [semanas, setSemanas] = useState(16);
  const [copiado, setCopiado] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [datos, setDatos] = useState({ materias: [], bloques: [], tareas: [] });
  const [mensaje, setMensaje] = useState('');
  const [funcion, setFuncion] = useState(null); // 'verificando' | 'activa' | 'inactiva'
  const [verGoogle, setVerGoogle] = useState(false);

  useEffect(() => {
    Promise.all([leerTabla('materias'), leerTabla('bloques_horario'), leerTabla('tareas')]).then(([materias, bloques, tareas]) =>
      setDatos({ materias, bloques, tareas: tareas.filter((t) => t.status !== 'hecha') })
    );
  }, []);

  const total = datos.materias.length + datos.bloques.length + datos.tareas.length;
  const zona = perfil?.zona_horaria || zonaLocal();
  const construir = () => generarICS({ ahora: new Date(), zona, semanas, ...datos });

  // ---- Opción 1: archivo .ics
  const descargar = () => {
    const url = URL.createObjectURL(new Blob([construir()], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workversity.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    setMensaje(`✅ Se generó workversity.ics con ${datos.materias.length + datos.bloques.length} eventos semanales y ${datos.tareas.length} tareas. Búscalo en tu carpeta de Descargas y ábrelo con tu calendario.`);
  };
  const compartir = async () => {
    const archivo = new File([construir()], 'workversity.ics', { type: 'text/calendar' });
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Mi agenda de Workversity' });
        setMensaje('✅ Elige “Calendario” (iPhone) o “Google Calendar” (Android) en el menú para importarlo.');
      } catch (e) {
        if (e?.name !== 'AbortError') descargar();
      }
    } else descargar();
  };
  const abrirDirecto = () => { window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(construir())}`; };

  // ---- Opción 2: suscripción (requiere la función desplegada)
  const token = perfil?.calendario_token;
  const enlace = token && supabaseUrl ? `${supabaseUrl}/functions/v1/calendario?token=${token}` : '';
  const webcal = enlace.replace(/^https?:/, 'webcal:');
  useEffect(() => {
    if (!enlace) return;
    let vivo = true;
    setFuncion('verificando');
    fetch(enlace, { cache: 'no-store' })
      .then(async (r) => { const t = await r.text(); if (vivo) setFuncion(r.ok && t.startsWith('BEGIN:VCALENDAR') ? 'activa' : 'inactiva'); })
      .catch(() => vivo && setFuncion('inactiva'));
    return () => { vivo = false; };
  }, [enlace]);

  const copiar = async (texto, clave) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(clave); setTimeout(() => setCopiado(''), 2000); } catch { /* nada */ }
  };
  const regenerar = async () => {
    if (!window.confirm('El enlace anterior dejará de funcionar y tendrás que volver a suscribirte. ¿Continuar?')) return;
    setTrabajando(true);
    try { await actualizarPerfil(usuario.id, { calendario_token: nuevoId() }); await refrescarPerfil(); } finally { setTrabajando(false); }
  };

  // ---- Opción 3: uno por uno en Google Calendar
  const items = useMemo(() => {
    const semanal = (titulo, dow, ini, fin, lugar, detalle) => { const i = proxima(dow, ini); const f = proxima(dow, fin); return { titulo, inicio: i, fin: f, lugar, detalle, semanas: 16, rotulo: 'Cada semana' }; };
    return [
      ...datos.materias.map((m) => semanal(`📚 ${m.nombre}`, m.day_of_week, m.start_minutes, m.end_minutes, m.es_virtual ? 'Virtual' : m.salon, [m.profesor && `Profesor: ${m.profesor}`, m.enlace_virtual].filter(Boolean).join('\n'))),
      ...datos.bloques.map((b) => semanal(`${b.type === 'reunion' ? '🤝' : b.type === 'trabajo' ? '💼' : '📌'} ${b.title}`, b.day_of_week, b.start_minutes, b.end_minutes, b.location, '')),
      ...[...datos.tareas].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 15).map((t) => ({ titulo: `📝 ${t.title}`, inicio: new Date(t.due_date), fin: new Date(new Date(t.due_date).getTime() + 30 * 60000), lugar: '', detalle: t.description || '', semanas: 0, rotulo: new Date(t.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) })),
    ];
  }, [datos]);

  const boton = 'flex items-center justify-center gap-2 rounded-sm2 px-4 py-2.5 text-sm font-bold transition';
  // La suscripción automática (opción "se actualiza sola") solo se muestra cuando de
  // verdad funciona. Si todavía no está lista, mejor no mostrarla en absoluto: las
  // otras dos formas ya cubren por completo llevar la agenda al calendario.
  const suscripcionDisponible = Boolean(token) && funcion === 'activa';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg2 bg-bg sm:rounded-lg2" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-bg px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold">Tu agenda en tu calendario</h2>
            <p className="text-xs text-textSecondary">Clases, bloques y tareas, en Google Calendar, Apple Calendar u Outlook</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="shrink-0 rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {total === 0 && (
            <div className="flex items-start gap-2.5 rounded-md2 bg-warningSoft p-3.5 text-xs font-semibold text-warning">
              <CalendarDays size={16} className="mt-0.5 shrink-0" />
              Aún no hay nada que llevar al calendario. Registra alguna materia, bloque o tarea y vuelve aquí.
            </div>
          )}

          {/* Opción principal: archivo .ics */}
          <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primarySoft text-primary"><Download size={17} /></span>
              <div>
                <p className="text-sm font-extrabold">Descargar e importar</p>
                <p className="text-xs text-textSecondary">La forma más directa: un archivo que abres con tu calendario</p>
              </div>
            </div>
            {total > 0 && (
              <p className="text-xs text-textSecondary">
                Incluye <b className="text-textPrimary">{datos.materias.length} clases</b>, <b className="text-textPrimary">{datos.bloques.length} bloques</b> y <b className="text-textPrimary">{datos.tareas.length} tareas pendientes</b>, cada uno con su alarma.
              </p>
            )}
            <label className="flex items-center justify-between text-sm font-semibold">
              Repetir clases durante
              <select value={semanas} onChange={(e) => setSemanas(Number(e.target.value))} className="rounded-sm2 bg-primarySoft/60 px-3 py-1.5 text-sm outline-none">
                {[8, 16, 20, 24, 32].map((n) => <option key={n} value={n}>{n} semanas</option>)}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={descargar} disabled={total === 0} className={`${boton} bg-primary text-white hover:bg-primaryDark disabled:opacity-50`}><Download size={16} /> Descargar archivo</button>
              <button onClick={compartir} disabled={total === 0} className={`${boton} border border-primary/40 text-primary disabled:opacity-50`}><Share2 size={16} /> Compartir / abrir</button>
            </div>
            {esIos() && <button onClick={abrirDirecto} disabled={total === 0} className={`${boton} w-full border border-black/10 disabled:opacity-50`}><Smartphone size={16} /> Abrir directo en Calendario</button>}
            {mensaje && <p className="flex items-center gap-1.5 rounded-sm2 bg-successSoft p-2.5 text-xs font-semibold text-success"><CheckCircle2 size={14} className="shrink-0" /> {mensaje}</p>}

            <details className="group rounded-sm2 bg-bg px-3 py-2 text-xs text-textSecondary open:pb-3">
              <summary className="cursor-pointer select-none list-none font-bold text-textPrimary marker:content-none">¿Cómo lo importo según mi calendario?</summary>
              <div className="mt-2 space-y-1.5">
                <p><b>Google Calendar (computador):</b> Configuración → Importar y exportar → Importar → elige el archivo.</p>
                <p><b>iPhone:</b> toca "Compartir / abrir" y elige Calendario, o abre el archivo y pulsa "Añadir todo". <b>Android:</b> "Compartir / abrir" → Google Calendar.</p>
                <p><b>Mac / Outlook:</b> abre el archivo con doble clic.</p>
              </div>
            </details>
          </section>

          {/* Opción: suscripción automática — solo si de verdad está activa */}
          {token && funcion === 'verificando' && (
            <section className="flex items-center gap-2.5 rounded-md2 bg-white p-4 text-xs font-semibold text-textSecondary shadow-card">
              <Loader2 size={15} className="shrink-0 animate-spin" /> Comprobando si la actualización automática está disponible…
            </section>
          )}
          {suscripcionDisponible && (
            <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-successSoft text-success"><RefreshCw size={16} /></span>
                <div>
                  <p className="text-sm font-extrabold">Suscribirte</p>
                  <p className="text-xs text-textSecondary">Se actualiza sola: no hay que volver a exportar nada</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input readOnly value={enlace} onFocus={(e) => e.target.select()} aria-label="Enlace de suscripción" className="min-w-0 flex-1 rounded-sm2 bg-primarySoft/60 px-3 py-2 text-[11px] outline-none" />
                <button onClick={() => copiar(enlace, 'enlace')} className="flex shrink-0 items-center gap-1.5 rounded-sm2 border border-primary/30 px-3 text-xs font-bold text-primary">
                  {copiado === 'enlace' ? <Check size={14} /> : <Copy size={14} />} {copiado === 'enlace' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer" className={`${boton} border border-black/10`}><CalendarPlus size={15} /> Google Calendar</a>
                <a href={webcal} className={`${boton} border border-black/10`}><Smartphone size={15} /> iPhone / Mac</a>
              </div>
              <p className="text-[11px] text-textSecondary">Google actualiza los calendarios suscritos cada 12–24 h; iPhone/Mac es más rápido. <b>No compartas este enlace:</b> quien lo tenga puede ver tu agenda.</p>
              <button onClick={regenerar} disabled={trabajando} className="flex items-center gap-1.5 text-xs font-bold text-textSecondary hover:text-danger"><RefreshCw size={13} className={trabajando ? 'animate-spin' : ''} /> Generar un enlace nuevo</button>
            </section>
          )}

          {/* Opción: uno por uno */}
          <section className="rounded-md2 bg-white p-4 shadow-card">
            <button onClick={() => setVerGoogle((v) => !v)} className="flex w-full items-center justify-between text-left">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primarySoft text-primary"><MousePointerClick size={16} /></span>
                <span>
                  <span className="block text-sm font-extrabold">Agregar uno por uno</span>
                  <span className="text-xs text-textSecondary">Sin archivos: un clic por evento, directo a Google Calendar</span>
                </span>
              </span>
              <ChevronDown size={18} className={`shrink-0 transition ${verGoogle ? 'rotate-180' : ''}`} />
            </button>
            {verGoogle && (
              <div className="mt-3 space-y-1.5">
                {items.length === 0 && <p className="rounded-sm2 bg-bg py-4 text-center text-xs text-textSecondary">Nada para agregar todavía.</p>}
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-sm2 bg-bg p-2">
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{it.titulo}</span><span className="text-[10px] text-textSecondary">{it.rotulo}</span></span>
                    <a href={enlaceGoogle(it)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-primary shadow-card">Agregar</a>
                  </div>
                ))}
                <p className="pt-1 text-[10px] text-textSecondary">Las clases se agregan repetidas cada semana; las tareas, en su fecha (se muestran las 15 más próximas).</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
