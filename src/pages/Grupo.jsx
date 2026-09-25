import { useCallback, useEffect, useMemo, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { Copy, Check, Crown, UserMinus, ShieldCheck, ChevronDown, Users2, Calendar, Trophy, Inbox, WifiOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { crearEspacio, unirseAEspacio, listarMisEspacios, listarMiembros, listarPerfilesDe, cambiarRolMiembro, quitarMiembro, eliminarEspacio, listarSolicitudes, crearSolicitud, responderSolicitud, eliminarSolicitud } from '../services/espacios';
import { esAdmin, nombreDeMiembro, tablaPosiciones, ordenarSolicitudes, destinatarioTexto } from '../lib/espacios';
import { traerConCacheRapida } from '../lib/cacheRapido';
import { formatearFechaHora } from '../lib/dateUtils';
import CrearOUnirse from '../components/grupo/CrearOUnirse';
import SolicitarHorario from '../components/grupo/SolicitarHorario';

export default function Grupo() {
  const { usuario } = useAuth();
  const [espacios, setEspacios] = useState(null); // null = cargando (sin nada que mostrar todavía)
  const [activoId, setActivoId] = useState(() => { try { return localStorage.getItem('workversity:espacio-activo'); } catch { return null; } });
  const [miembros, setMiembros] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [mostrandoDeCache, setMostrandoDeCache] = useState(false);

  // La pantalla de Grupo depende de otras personas, así que necesita el servidor — pero eso no
  // debe significar quedarse "cargando…" cada vez que la red anda lenta. Se guarda la última
  // respuesta buena y se muestra de inmediato, mientras de fondo se intenta traer algo más nuevo
  // (máximo unos segundos: si tarda más, se sigue mostrando lo guardado sin más espera).
  const cargarEspacios = useCallback(async () => {
    try {
      const { datos: lista, deCache } = await traerConCacheRapida(
        `espacios:${usuario.id}`,
        () => listarMisEspacios(usuario.id),
        { onRapido: setEspacios }
      );
      setEspacios(lista);
      setMostrandoDeCache(deCache);
      if (lista.length > 0 && !lista.some((e) => e.id === activoId)) setActivoId(lista[0].id);
    } catch (err) {
      setEspacios((e) => e ?? []);
      setError(mensajeAmigable(err, 'cargar tus espacios'));
    }
  }, [usuario.id, activoId]);
  useEffect(() => { cargarEspacios(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const espacio = espacios?.find((e) => e.id === activoId) || null;

  const cargarDetalle = useCallback(async () => {
    if (!espacio) return;
    const pedir = async () => {
      const m = await listarMiembros(espacio.id);
      const p = await listarPerfilesDe(m.map((x) => x.user_id));
      const s = await listarSolicitudes(espacio.id);
      return { miembros: m, perfiles: p, solicitudes: s };
    };
    const aplicar = (d) => {
      setMiembros(d.miembros.map((x) => ({ ...x, esYo: x.user_id === usuario.id })));
      setPerfiles(d.perfiles);
      setSolicitudes(d.solicitudes);
    };
    try {
      const { datos, deCache } = await traerConCacheRapida(`espacio-detalle:${espacio.id}`, pedir, { onRapido: aplicar });
      aplicar(datos);
      setMostrandoDeCache(deCache);
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar este espacio'));
    }
  }, [espacio, usuario.id]);
  useEffect(() => { cargarDetalle(); }, [cargarDetalle]);

  useEffect(() => { if (activoId) { try { localStorage.setItem('workversity:espacio-activo', activoId); } catch { /* nada */ } } }, [activoId]);

  const crear = async (nombre) => {
    setError('');
    try { const e = await crearEspacio(nombre); setActivoId(e.id); await cargarEspacios(); } catch (err) { setError(mensajeAmigable(err, 'crear el espacio')); }
  };
  const unirse = async (codigo) => {
    setError('');
    try { const e = await unirseAEspacio(codigo); setActivoId(e.id); await cargarEspacios(); } catch (err) { setError(mensajeAmigable(err, 'unirte con ese código')); }
  };

  const yo = miembros.find((m) => m.esYo);
  const soyAdmin = esAdmin(yo);
  const posiciones = useMemo(() => tablaPosiciones(miembros, perfiles), [miembros, perfiles]);
  const solicitudesOrdenadas = useMemo(() => ordenarSolicitudes(solicitudes), [solicitudes]);
  const aceptadas = useMemo(() => solicitudes.filter((s) => s.estado === 'aceptada').sort((a, b) => new Date(a.inicio) - new Date(b.inicio)), [solicitudes]);

  const copiarCodigo = () => { navigator.clipboard.writeText(espacio.codigo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); };
  const enviarSolicitud = async (datos) => {
    try { await crearSolicitud({ espacio_id: espacio.id, de_user_id: usuario.id, ...datos }); await cargarDetalle(); }
    catch (err) { setError(mensajeAmigable(err, 'enviar la solicitud')); }
  };
  const responder = async (id, estado) => {
    try { await responderSolicitud(id, estado); await cargarDetalle(); }
    catch (err) { setError(mensajeAmigable(err, 'responder la solicitud')); }
  };
  const cancelar = async (id) => {
    try { await eliminarSolicitud(id); await cargarDetalle(); }
    catch (err) { setError(mensajeAmigable(err, 'cancelar la solicitud')); }
  };
  const ascender = async (m) => {
    try { await cambiarRolMiembro(m.id, m.rol === 'admin' ? 'miembro' : 'admin'); await cargarDetalle(); }
    catch (err) { setError(mensajeAmigable(err, 'cambiar el rol')); }
  };
  const quitar = async (m) => {
    if (!window.confirm(`¿Quitar a ${nombreDeMiembro(m, perfiles)} del espacio?`)) return;
    try { await quitarMiembro(m.id); await cargarDetalle(); }
    catch (err) { setError(mensajeAmigable(err, 'quitar a esa persona')); }
  };
  const salirme = async () => {
    if (!window.confirm(soyAdmin && miembros.length > 1 ? '¿Salir de este espacio? Como eres admin, alguien más quedará a cargo.' : '¿Salir de este espacio?')) return;
    try {
      await quitarMiembro(yo.id);
      setActivoId(null);
      await cargarEspacios();
    } catch (err) { setError(mensajeAmigable(err, 'salir del espacio')); }
  };
  const eliminarTodoElEspacio = async () => {
    if (!window.confirm(`Esto elimina «${espacio.nombre}» para TODOS los miembros, junto con sus solicitudes. No se puede deshacer. ¿Seguro?`)) return;
    try {
      await eliminarEspacio(espacio.id);
      setActivoId(null);
      await cargarEspacios();
    } catch (err) { setError(mensajeAmigable(err, 'eliminar el espacio')); }
  };

  if (espacios === null) return <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>;
  if (!espacio) return <CrearOUnirse onCrear={crear} onUnirse={unirse} error={error} />;

  return (
    <div className="space-y-4">
      {mostrandoDeCache && (
        <p className="flex items-center gap-1.5 rounded-sm2 bg-warningSoft px-3 py-2 text-xs font-semibold text-warning">
          <WifiOff size={13} /> Sin conexión ahora mismo: mostrando lo último que se guardó de este espacio.
        </p>
      )}
      {error && <p className="rounded-sm2 bg-dangerSoft px-3 py-2 text-xs font-semibold text-danger">{error}</p>}
      <div className="rounded-md2 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <button onClick={() => setSelectorAbierto((v) => !v)} className="flex items-center gap-1.5 text-lg font-extrabold">
              <Users2 size={18} className="text-primary" /> {espacio.nombre} <ChevronDown size={16} />
            </button>
            {selectorAbierto && (
              <div className="absolute z-10 mt-1 w-56 rounded-sm2 bg-white p-1.5 shadow-xl">
                {espacios.map((e) => (
                  <button key={e.id} onClick={() => { setActivoId(e.id); setSelectorAbierto(false); }} className={`block w-full rounded-sm2 px-2.5 py-2 text-left text-sm ${e.id === activoId ? 'bg-primarySoft font-bold text-primary' : ''}`}>{e.nombre}</button>
                ))}
                <button onClick={() => { setActivoId(null); setSelectorAbierto(false); }} className="mt-1 block w-full rounded-sm2 border-t border-black/5 px-2.5 py-2 text-left text-xs font-bold text-primary">+ Crear o unirme a otro</button>
              </div>
            )}
          </div>
          <button onClick={soyAdmin ? eliminarTodoElEspacio : salirme} className="flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-bold text-danger">
            <LogOut size={13} /> {soyAdmin ? 'Eliminar espacio' : 'Salir del espacio'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-textSecondary">Código de invitación:</span>
          <code className="rounded-sm2 bg-primarySoft/60 px-2.5 py-1 text-sm font-extrabold tracking-widest text-primary">{espacio.codigo}</code>
          <button onClick={copiarCodigo} className="flex items-center gap-1 rounded-full border border-primary/30 px-2.5 py-1 text-[11px] font-bold text-primary">{copiado ? <Check size={12} /> : <Copy size={12} />} {copiado ? 'Copiado' : 'Copiar'}</button>
        </div>
      </div>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={16} /> Miembros ({miembros.length})</p>
        <div className="space-y-1.5">
          {miembros.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{nombreDeMiembro(m, perfiles)}</span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${m.rol === 'admin' ? 'bg-primarySoft text-primary' : 'bg-black/5 text-textSecondary'}`}>{m.rol === 'admin' && <Crown size={10} />} {m.rol === 'admin' ? 'Admin' : 'Miembro'}</span>
              {soyAdmin && !m.esYo && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => ascender(m)} className="rounded-full border border-black/10 px-2 py-1 text-[10px] font-bold text-textSecondary">{m.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}</button>
                  <button onClick={() => quitar(m)} aria-label="Quitar del espacio" className="rounded p-1 text-textSecondary hover:text-danger"><UserMinus size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Trophy size={16} className="text-warning" /> Tabla de posiciones (puntos)</p>
        <div className="space-y-1.5">
          {posiciones.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5">
              <span className="w-5 text-center text-sm font-extrabold text-textSecondary">{i + 1}</span>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{m.nombre}</span>
              <span className="text-sm font-extrabold text-primary">{m.puntos} pts</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-textSecondary">Se suman con tus tareas, Pomodoros y rachas de siempre; aquí solo se comparan.</p>
      </section>

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Calendar size={16} /> Agenda compartida</p>
        {aceptadas.length === 0 ? (
          <p className="py-6 text-center text-sm text-textSecondary">Nada confirmado todavía. Pide un espacio abajo.</p>
        ) : (
          <div className="space-y-1.5">
            {aceptadas.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: miembros.find((m) => m.user_id === s.de_user_id)?.color || '#8B93A7' }} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{s.titulo}</span><span className="text-[11px] text-textSecondary">De {nombreDeMiembro(miembros.find((m) => m.user_id === s.de_user_id) || {}, perfiles)} · {destinatarioTexto(s, miembros, perfiles)}</span></span>
                <span className="shrink-0 text-[11px] font-bold text-textSecondary">{formatearFechaHora(s.inicio)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SolicitarHorario miembros={miembros} perfiles={perfiles} ocupados={aceptadas.map((s) => ({ inicio: new Date(s.inicio), fin: new Date(s.fin), titulo: s.titulo }))} onEnviar={enviarSolicitud} />

      <section className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Inbox size={16} /> Solicitudes</p>
        {solicitudesOrdenadas.length === 0 ? (
          <p className="py-6 text-center text-sm text-textSecondary">No hay solicitudes todavía.</p>
        ) : (
          <div className="space-y-2">
            {solicitudesOrdenadas.map((s) => {
              const esMia = s.de_user_id === usuario.id;
              const puedoResponder = !esMia && s.estado === 'pendiente' && (!s.para_user_id || s.para_user_id === usuario.id);
              return (
                <div key={s.id} className="rounded-sm2 bg-bg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate text-sm font-bold">{s.titulo}</p><p className="text-[11px] text-textSecondary">De {nombreDeMiembro(miembros.find((m) => m.user_id === s.de_user_id) || {}, perfiles)} · {destinatarioTexto(s, miembros, perfiles)} · {formatearFechaHora(s.inicio)}</p></div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${s.estado === 'pendiente' ? 'bg-warningSoft text-warning' : s.estado === 'aceptada' ? 'bg-successSoft text-success' : 'bg-dangerSoft text-danger'}`}>{s.estado}</span>
                  </div>
                  {s.nota && <p className="mt-1 text-xs text-textSecondary">{s.nota}</p>}
                  <div className="mt-2 flex gap-2">
                    {puedoResponder && (
                      <>
                        <button onClick={() => responder(s.id, 'aceptada')} className="rounded-full border border-success/30 px-2.5 py-1 text-[11px] font-bold text-success">Aceptar</button>
                        <button onClick={() => responder(s.id, 'rechazada')} className="rounded-full border border-danger/30 px-2.5 py-1 text-[11px] font-bold text-danger">Rechazar</button>
                      </>
                    )}
                    {esMia && s.estado === 'pendiente' && <button onClick={() => cancelar(s.id)} className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-bold text-textSecondary">Cancelar</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
