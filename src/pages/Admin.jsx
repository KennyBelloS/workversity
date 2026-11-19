import { useEffect, useMemo, useRef, useState } from 'react';
import { Users, UserCheck, UserPlus, Clock, Search, KeyRound, Ban, RotateCcw, Trash2, ShieldAlert, Bug, Play, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarUsuarios, suspenderUsuario, reactivarUsuario, eliminarUsuario, resetearPasswordUsuario } from '../services/admin';
import { calcularEstadisticasUsuarios, ordenarPorUltimoIngreso, registrosPorSemana, filtrarUsuarios } from '../lib/admin';
import { mostrarSnackbar } from '../lib/snackbar';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { CATALOGO_BICHOS } from '../components/decoracion/Bichos';
import KoiEstanque from '../components/decoracion/KoiEstanque';
import PaisajeVivo from '../components/decoracion/PaisajeVivo';

function KpiOscuro({ icono: Icono, etiqueta, valor, i = 0 }) {
  return (
    <div className="bento-pieza !min-h-0 !rounded-[18px] !p-4" style={{ '--i': i }}>
      <div className="flex items-center justify-between text-textSecondary"><span className="rotulo">{etiqueta}</span><Icono size={14} strokeWidth={1.7} /></div>
      <p className="font-display mt-3 text-[2.4rem] leading-none">{valor}</p>
    </div>
  );
}

/** Mini gráfica de barras hecha a mano (sin librería): registros por semana, con tooltip al pasar el mouse. */
function Chispa({ serie }) {
  const max = Math.max(1, ...serie);
  const [sobre, setSobre] = useState(null);
  return (
    <div className="flex h-20 items-end gap-1.5">
      {serie.map((v, i) => (
        <div key={i} className="group relative flex h-full flex-1 items-end" onMouseEnter={() => setSobre(i)} onMouseLeave={() => setSobre(null)}>
          {sobre === i && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-textPrimary px-1.5 py-0.5 font-mono text-t-nota text-surface">{v} registro{v !== 1 ? 's' : ''}</span>
          )}
          <div className={`w-full rounded-[5px] transition-all ${i === serie.length - 1 ? 'bg-primary' : 'bg-textPrimary/15 group-hover:bg-textPrimary/30'}`} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

function filaFecha(iso) {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Admin() {
  const { perfil } = useAuth();
  const [tab, setTab] = useState('usuarios'); // 'usuarios' | 'animaciones'
  const [usuarios, setUsuarios] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [ocupado, setOcupado] = useState(null); // id del usuario con una acción en curso

  const cargar = () => listarUsuarios().then(setUsuarios).catch((err) => mostrarSnackbar({ texto: mensajeAmigable(err, 'cargar los usuarios') }));
  useEffect(() => { if (perfil?.es_admin) cargar(); }, [perfil?.es_admin]);

  const stats = useMemo(() => calcularEstadisticasUsuarios(usuarios || []), [usuarios]);
  const serie = useMemo(() => registrosPorSemana(usuarios || [], 8), [usuarios]);
  const filtrados = useMemo(() => filtrarUsuarios(ordenarPorUltimoIngreso(usuarios || []), busqueda), [usuarios, busqueda]);

  const conAccion = async (id, fn, mensajeOk) => {
    setOcupado(id);
    try {
      await fn();
      mostrarSnackbar({ texto: mensajeOk });
      await cargar();
    } catch (err) {
      mostrarSnackbar({ texto: mensajeAmigable(err, 'completar esa acción') });
    } finally {
      setOcupado(null);
    }
  };

  const onSuspender = (u) => window.confirm(`¿Suspender la cuenta de ${u.nombre}? No podrá iniciar sesión hasta que la reactives.`) && conAccion(u.id, () => suspenderUsuario(u.id), 'Cuenta suspendida.');
  const onReactivar = (u) => conAccion(u.id, () => reactivarUsuario(u.id), 'Cuenta reactivada.');
  const onEliminar = (u) => window.confirm(`¿Eliminar la cuenta de ${u.nombre} para siempre? Esto no se puede deshacer.`) && conAccion(u.id, () => eliminarUsuario(u.id), 'Cuenta eliminada.');
  const onResetearPassword = (u) => {
    const nueva = window.prompt(`Nueva contraseña para ${u.nombre} (mínimo 6 caracteres):`);
    if (!nueva) return;
    conAccion(u.id, () => resetearPasswordUsuario(u.id, nueva), 'Contraseña actualizada.');
  };

  if (!perfil) return null;
  if (!perfil.es_admin) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-textSecondary">
        <ShieldAlert size={28} />
        <p className="text-sm font-bold">Esta sección es solo para administradores.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-2 pt-1">
        <p className="rotulo">Panel de administrador</p>
        <h1 className="mt-2 text-[2.1rem] font-light leading-tight tracking-[-0.04em] sm:text-[2.5rem]">Gestión de <span className="font-semibold">Workversity</span></h1>

        <div className="seg mt-5" role="tablist">
          {[{ id: 'usuarios', t: 'Usuarios' }, { id: 'animaciones', t: 'Animaciones' }].map((p) => (
            <button key={p.id} role="tab" aria-selected={tab === p.id} onClick={() => setTab(p.id)} className={`seg-op ${tab === p.id ? 'activo' : ''}`}>
              {p.t}
            </button>
          ))}
        </div>

        {tab === 'usuarios' && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiOscuro i={0} icono={Users} etiqueta="Usuarios" valor={stats.total} />
              <KpiOscuro i={1} icono={UserCheck} etiqueta="Activos 7d" valor={stats.activos7d} />
              <KpiOscuro i={2} icono={UserPlus} etiqueta="Nuevos 7d" valor={stats.nuevos7d} />
              <KpiOscuro i={3} icono={Clock} etiqueta="Sin entrar" valor={stats.nuncaEntraron} />
            </div>

            <div className="bento-pieza mt-3 !min-h-0 !rounded-[18px] !p-4" style={{ '--i': 4 }}>
              <p className="rotulo mb-4">Registros por semana · últimas 8</p>
              <Chispa serie={serie} />
            </div>
          </>
        )}
      </div>

      {tab === 'usuarios' && (
        <div className="pt-5">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 ring-1 ring-textPrimary/5">
            <Search size={15} className="text-textSecondary" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo…" className="w-full bg-transparent text-sm outline-none" />
          </div>

          {!usuarios ? (
            <p className="py-10 text-center text-sm text-textSecondary">Cargando usuarios…</p>
          ) : filtrados.length === 0 ? (
            <p className="py-10 text-center text-sm text-textSecondary">Nadie coincide con esa búsqueda.</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-surface p-3 ring-1 ring-textPrimary/5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-textPrimary">
                      {u.nombre}
                      {u.es_admin && <span className="rounded-full bg-primarySoft px-2 py-0.5 text-t-nota font-bold text-primary">Admin</span>}
                      {u.suspendida && <span className="rounded-full bg-dangerSoft px-2 py-0.5 text-t-nota font-bold text-danger">Suspendida</span>}
                    </p>
                    <p className="truncate text-xs text-textSecondary">{u.correo}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end text-t-micro text-textSecondary">
                    <span>Último ingreso: {filaFecha(u.ultimo_ingreso)}</span>
                    <span>{u.total_ingresos || 0} entradas · Registrado {filaFecha(u.created_at)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {u.es_admin ? (
                      <span className="px-2 text-t-micro font-semibold text-textSecondary">Cuenta protegida</span>
                    ) : (
                      <>
                        <button onClick={() => onResetearPassword(u)} disabled={ocupado === u.id} title="Cambiar contraseña" className="rounded-full p-2 text-textSecondary hover:bg-primarySoft/60 hover:text-primary disabled:opacity-40"><KeyRound size={16} /></button>
                        {u.suspendida ? (
                          <button onClick={() => onReactivar(u)} disabled={ocupado === u.id} title="Reactivar cuenta" className="rounded-full p-2 text-textSecondary hover:bg-successSoft hover:text-success disabled:opacity-40"><RotateCcw size={16} /></button>
                        ) : (
                          <button onClick={() => onSuspender(u)} disabled={ocupado === u.id} title="Suspender cuenta" className="rounded-full p-2 text-textSecondary hover:bg-warningSoft hover:text-warning disabled:opacity-40"><Ban size={16} /></button>
                        )}
                        <button onClick={() => onEliminar(u)} disabled={ocupado === u.id} title="Eliminar cuenta" className="rounded-full p-2 text-textSecondary hover:bg-dangerSoft hover:text-danger disabled:opacity-40"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'animaciones' && (
        <div className="pt-5">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-textPrimary"><Bug size={15} strokeWidth={1.7} /> Animaciones decorativas</p>
          <p className="mb-4 text-xs text-textSecondary">Las animaciones que decoran la app, en vivo y con tu color de acento. En la araña, toca «Probar» para verla salir de su esquina.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {CATALOGO_BICHOS.map((b) => <VistaPreviaBicho key={b.id} bicho={b} />)}
            <Escena
              nombre="Estanque de koi"
              descripcion="Peces hechos de cuadritos que nadan siguiendo su columna, se apartan del puntero y van tras la comida. Toca el agua para soltar comida. Las manchas usan tu color de acento."
              donde={['Inicio de sesión, dentro de la franja oscura', 'Cabecera de «Nueva contraseña»']}
            >
              <KoiEstanque cuantos={4} celda={8} tema="oscuro" />
            </Escena>
            <Escena
              nombre="Paisaje vivo"
              descripcion="Grabado de un lago con pueblo, montañas reflejadas, veleros a la deriva y follaje que se mece, dibujado en el color de acento."
              donde={['Pie de página del Dashboard']}
              claro
            >
              <div className="escena-paisaje absolute inset-0" style={{ background: 'var(--papel)' }}><div className="absolute inset-x-0 bottom-0 h-full"><PaisajeVivo /></div></div>
            </Escena>
          </div>
        </div>
      )}
    </div>
  );
}

/** Escena decorativa a pantalla completa dentro de un marco. */
function Escena({ nombre, descripcion, donde, claro = false, children }) {
  return (
    <div className="overflow-hidden rounded-md2 bg-surface shadow-card">
      <div className={`relative h-72 overflow-hidden border-b border-black/5 ${claro ? 'bg-bg' : 'bg-[#141412]'}`}>{children}</div>
      <div className="space-y-3 p-4">
        <p className="text-sm font-semibold text-textPrimary">{nombre}</p>
        <p className="text-xs leading-relaxed text-textSecondary">{descripcion}</p>
        <ul className="space-y-1">
          {donde.map((d) => <li key={d} className="flex items-start gap-1.5 text-xs text-textSecondary"><MapPin size={12} className="mt-0.5 shrink-0 text-primary" /> {d}</li>)}
        </ul>
      </div>
    </div>
  );
}

/** Tarjeta con la animación funcionando de verdad dentro de un marco, igual que en la app. */
function VistaPreviaBicho({ bicho }) {
  const ref = useRef(null);
  const marco = useRef(null);
  const [ocupada, setOcupada] = useState(false);
  const probar = async () => {
    if (ocupada || !ref.current?.buscar) return;
    setOcupada(true);
    const caja = marco.current.getBoundingClientRect();
    await ref.current.buscar({ x: caja.width * 0.22, y: caja.height * 0.78 });
    setTimeout(() => setOcupada(false), 1300);
  };
  const { Componente } = bicho;
  return (
    <div className="overflow-hidden rounded-md2 bg-surface shadow-card">
      <div ref={marco} className="relative h-56 overflow-hidden border-b border-black/5" style={{ background: 'linear-gradient(180deg, #FBFAF6, #F1EFE8)' }}>
        <div className="absolute bottom-5 left-5 right-24">
          <p className="text-t-nota font-bold uppercase tracking-[0.3em] text-primary">Vista previa</p>
          <p className="mt-1 text-2xl font-light tracking-tight text-textPrimary">{bicho.nombre}</p>
        </div>
        <Componente ref={ref} esquina="sup-der" escala={1.05} />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-textPrimary">
            {bicho.nombre}
            {bicho.predeterminado && <span className="rounded-full bg-primarySoft px-2 py-0.5 text-t-nota font-bold text-primary">Predeterminada</span>}
          </p>
          <button onClick={probar} disabled={ocupada} className="flex items-center gap-1.5 rounded-full bg-textPrimary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
            <Play size={12} /> Probar
          </button>
        </div>
        <p className="text-xs leading-relaxed text-textSecondary">{bicho.descripcion}</p>
        <ul className="space-y-1">
          {bicho.donde.map((d) => <li key={d} className="flex items-start gap-1.5 text-xs text-textSecondary"><MapPin size={12} className="mt-0.5 shrink-0 text-primary" /> {d}</li>)}
        </ul>
      </div>
    </div>
  );
}
