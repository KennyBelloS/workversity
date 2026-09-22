import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, BellRing } from 'lucide-react';
import { leerTabla } from '../../offline/db';
import { useSyncEstado } from '../../hooks/useSyncEstado';
import { calcularAlertas } from '../../lib/alertas';
import { estadoPresupuesto } from '../../lib/presupuesto';
import { debeSugerirRevision, leerUltimaRevision } from '../../lib/revision';
import { actualizarInsignia } from '../../lib/nativo';
import { estadoProgreso } from '../../lib/progresoMeta';
import { agruparNotas, leerMetaNota } from '../../lib/notas';
import { calcularHabitos, leerAprender } from '../../lib/habitos';

const CLAVE = 'workversity:alertas-vistas';
const COLOR = { alta: '#E5484D', media: '#F5A524', info: '#3E7BFA' };

const leerVistas = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]'));
  } catch {
    return new Set();
  }
};

export default function CentroNotificaciones() {
  const navigate = useNavigate();
  const { version } = useSyncEstado();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState({ tareas: [], materias: [], bloques: [], evaluaciones: [], cortes: [], sesiones: [], energia: [], movimientos: [], presupuestos: [], metas: [], avances: [] });
  const [ahora, setAhora] = useState(new Date());
  const [vistas, setVistas] = useState(leerVistas);
  const caja = useRef(null);

  // Se lee la copia guardada en el dispositivo: es instantáneo y funciona sin internet.
  const cargar = async () => {
    const [tareas, materias, bloques, evaluaciones, cortes, sesiones, energia, movimientos, presupuestos, metas, avances] = await Promise.all([leerTabla('tareas'), leerTabla('materias'), leerTabla('bloques_horario'), leerTabla('evaluaciones'), leerTabla('cortes_notas'), leerTabla('sesiones_pomodoro'), leerTabla('registros_energia'), leerTabla('movimientos'), leerTabla('presupuestos_mensuales'), leerTabla('metas'), leerTabla('avances_meta')]);
    setDatos({ tareas, materias, bloques, evaluaciones, cortes, sesiones, energia, movimientos, presupuestos, metas, avances });
    setAhora(new Date());
  };
   
  useEffect(() => { cargar(); }, [version, abierto]);
  useEffect(() => {
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto]);

  const alertas = useMemo(
    () => calcularAlertas({ ahora, tareas: datos.tareas, materias: datos.materias, bloques: datos.bloques, notas: agruparNotas({ materias: datos.materias, evaluaciones: datos.evaluaciones, cortes: datos.cortes, meta: leerMetaNota() }), habitos: leerAprender() ? calcularHabitos({ tareas: datos.tareas, sesiones: datos.sesiones, energia: datos.energia, materias: datos.materias }) : null, presupuesto: estadoPresupuesto({ ahora, movimientos: datos.movimientos, presupuestos: datos.presupuestos }), sugerirRevision: debeSugerirRevision(ahora, leerUltimaRevision()), metasProgreso: datos.metas.filter((m) => m.tipo === 'progreso').map((m) => ({ meta: m, e: estadoProgreso({ meta: m, avances: datos.avances.filter((a) => a.meta_id === m.id), ahora }) })) }),
    [ahora, datos]
  );
  const nuevas = alertas.filter((a) => !vistas.has(a.id));

  // Número sobre el ícono de la app instalada: tareas vencidas o que vencen hoy.
  useEffect(() => {
    const fin = new Date(ahora); fin.setHours(23, 59, 59, 999);
    actualizarInsignia(datos.tareas.filter((t) => t.status !== 'hecha' && new Date(t.due_date) <= fin).length);
  }, [datos, ahora]);

  const guardarVistas = (ids) => {
    const todas = new Set([...vistas, ...ids]);
    setVistas(todas);
    try { localStorage.setItem(CLAVE, JSON.stringify([...todas].slice(-300))); } catch { /* nada */ }
  };
  const abrir = (a) => { guardarVistas([a.id]); setAbierto(false); navigate(a.url); };

  const permiso = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  return (
    <div ref={caja} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Notificaciones${nuevas.length ? `: ${nuevas.length} nuevas` : ''}`}
        className="relative rounded-full p-2 text-textSecondary hover:bg-black/5 hover:text-textPrimary"
      >
        <Bell size={18} />
        {nuevas.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">
            {nuevas.length > 9 ? '9+' : nuevas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[75vh] overflow-y-auto rounded-md2 border border-black/10 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3">
            <p className="text-sm font-extrabold">Notificaciones</p>
            {nuevas.length > 0 && (
              <button onClick={() => guardarVistas(alertas.map((a) => a.id))} className="flex items-center gap-1 text-[11px] font-bold text-primary">
                <CheckCheck size={13} /> Marcar como vistas
              </button>
            )}
          </div>

          {alertas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-textSecondary">Todo al día 🎉<br /><span className="text-xs">No hay nada urgente ni próximo.</span></p>
          ) : (
            <ul className="divide-y divide-black/5">
              {alertas.map((a) => {
                const vista = vistas.has(a.id);
                return (
                  <li key={a.id}>
                    <button onClick={() => abrir(a)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-black/5 ${vista ? 'opacity-55' : ''}`}>
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLOR[a.nivel] }} />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold leading-snug">{a.titulo}</span>
                        <span className="block text-[11px] text-textSecondary">{a.detalle}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {permiso !== 'granted' && (
            <button onClick={() => { setAbierto(false); navigate('/configuracion'); }} className="flex w-full items-center gap-2 border-t border-black/5 bg-primarySoft px-4 py-3 text-left text-xs font-bold text-primary">
              <BellRing size={15} /> Activa los avisos para recibirlos con la app cerrada
            </button>
          )}
        </div>
      )}
    </div>
  );
}
