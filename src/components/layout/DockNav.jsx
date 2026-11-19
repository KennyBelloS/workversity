import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard, CalendarClock, KanbanSquare, Wallet, BookOpen, Sparkles, BarChart3, Target,
  Settings, HelpCircle, GraduationCap, Users2, NotebookPen, Grid2x2, LogOut, Sun, Moon,
} from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useAuth } from '../../context/AuthContext';
import { useTema, elegirTema } from '../../hooks/useTema';
import { NATURAL, RAPIDO, sinMovimiento } from '../../lib/movimiento';
import Hoja from '../ui/Hoja';

export const TODOS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true, primario: true },
  { to: '/horario', label: 'Agenda', icon: CalendarClock, primario: true },
  { to: '/tareas', label: 'Tareas', icon: KanbanSquare, primario: true },
  { to: '/materias', label: 'Materias', icon: BookOpen, primario: true },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, primario: true },
  { to: '/analitica', label: 'Asistente', icon: Sparkles },
  { to: '/resumen', label: 'Resumen', icon: BarChart3 },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/parciales', label: 'Parciales', icon: GraduationCap },
  { to: '/grupo', label: 'Grupo', icon: Users2 },
  { to: '/apuntes', label: 'Apuntes', icon: NotebookPen },
  { to: '/configuracion', label: 'Ajustes', icon: Settings },
  { to: '/ayuda', label: 'Cómo se usa', icon: HelpCircle },
];

/** Las cinco de siempre, en el orden en que se deslizan con el dedo. */
export const PRIMARIAS = TODOS.filter((i) => i.primario);

/** Agrupación por para qué sirve cada sección: la usa la barra de computador. */
const GRUPOS = [
  { rutas: ['/'] },
  { rutas: ['/tareas', '/horario', '/materias', '/apuntes'] },
  { rutas: ['/parciales', '/analitica', '/resumen', '/metas'] },
  { rutas: ['/finanzas', '/grupo', '/configuracion', '/ayuda'] },
];
const porRuta = new Map(TODOS.map((i) => [i.to, i]));

// ---------------------------------------------------------------------------------------------
// Barra de navegación: siempre flota abajo, en celular y en computador, al alcance de la mano.
// En celular, solo la sección activa muestra su nombre (su pastilla se estira) y las demás
// quedan en ícono, así caben seis sin apretarse; la barra se esconde al bajar y vuelve al subir.
// En computador caben las trece secciones a la vez, solo en ícono (el nombre vive en el title,
// como una barra de herramientas), agrupadas por para qué sirve cada una.
// ---------------------------------------------------------------------------------------------

function Op({ item, activo, compacta }) {
  const Icono = item.icon;
  return (
    <span className={`dk-op ${activo ? 'dk-op--activa' : ''}`}>
      <span className="dk-icono"><Icono size={18} strokeWidth={activo ? 2 : 1.7} /></span>
      <span className="dk-texto">{item.label}</span>
      {compacta && activo && <span className="dk-punto" aria-hidden="true" />}
    </span>
  );
}

/** Barra de computador: las 13 secciones en ícono, agrupadas, flotando abajo. */
function BarraEscritorio() {
  const { perfil, usuario, logout } = useAuth();
  const { oscuro } = useTema();
  const quieto = sinMovimiento();
  const nombre = perfil?.nombre || usuario?.email || '';
  const inicial = (nombre.trim()[0] || '?').toUpperCase();

  return (
    <nav aria-label="Navegación principal" className="bn">
      {GRUPOS.map((g, k) => (
        <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          {k > 0 && <span className="bn-sep" aria-hidden="true" />}
          {g.rutas.map((ruta) => {
            const i = porRuta.get(ruta);
            if (!i) return null;
            const Icono = i.icon;
            return (
              <NavLink key={ruta} to={ruta} end={i.end} data-tip={i.label} aria-label={i.label} className="bn-enlace">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId={quieto ? undefined : 'bn-activo'} transition={NATURAL} className="bn-tinta" aria-hidden="true" />
                    )}
                    <Icono size={17} strokeWidth={isActive ? 2 : 1.7} />
                  </>
                )}
              </NavLink>
            );
          })}
        </span>
      ))}
      <span className="bn-cuenta">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={RAPIDO}
          onClick={() => elegirTema(oscuro ? 'claro' : 'oscuro')}
          aria-label="Cambiar tema"
          data-tip={oscuro ? 'Modo claro' : 'Modo oscuro'}
          className="bn-mini"
        >
          {oscuro ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={RAPIDO}
          onClick={logout}
          aria-label="Cerrar sesión"
          data-tip="Cerrar sesión"
          className="bn-mini"
        >
          <LogOut size={15} />
        </motion.button>
        <span className="bn-avatar" data-tip={nombre} aria-hidden="true">{inicial}</span>
      </span>
    </nav>
  );
}

export default function DockNav() {
  const ancha = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();
  const [hoja, setHoja] = useState(false);
  const [oculta, setOculta] = useState(false);
  const extra = TODOS.filter((i) => !i.primario);
  const enExtra = extra.some((i) => pathname.startsWith(i.to) && i.to !== '/');

  useEffect(() => { setHoja(false); }, [pathname]);

  // Esconder al bajar, mostrar al subir. Solo en celular y tablet.
  useEffect(() => {
    if (ancha) { setOculta(false); return undefined; }
    let ultimo = window.scrollY;
    const alScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - ultimo) < 12) return;
      setOculta(y > ultimo && y > 90);
      ultimo = y;
    };
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, [ancha]);

  // Pulsación larga sobre la barra: abre todas las secciones.
  // En computador manda la barra lateral; esta barra es solo del celular.
  const temporizador = useRef(null);
  const empezarPulsacion = useCallback(() => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setHoja(true), 430);
  }, []);
  const soltarPulsacion = useCallback(() => clearTimeout(temporizador.current), []);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  if (ancha) return <BarraEscritorio />;

  return (
    <>
      <nav
        aria-label="Navegación principal"
        data-oculta={oculta ? '1' : undefined}
        className="dk"
        onPointerDown={empezarPulsacion}
        onPointerUp={soltarPulsacion}
        onPointerCancel={soltarPulsacion}
        onPointerLeave={soltarPulsacion}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="dk-fila">
          {PRIMARIAS.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className="dk-enlace" aria-label={i.label}>
              {({ isActive }) => <Op item={i} activo={isActive} compacta />}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setHoja(true)}
            aria-haspopup="dialog"
            aria-expanded={hoja}
            aria-label="Todas las secciones"
            className="dk-enlace"
          >
            <Op item={{ label: 'Todo', icon: Grid2x2 }} activo={hoja || enExtra} compacta />
          </button>
        </div>
      </nav>

      {hoja && <HojaSecciones onCerrar={() => setHoja(false)} />}
    </>
  );
}

/** Hoja con todas las secciones, para cuando no caben abajo. Usa la hoja compartida. */
function HojaSecciones({ onCerrar }) {
  return (
    <Hoja abierta onCerrar={onCerrar} rotulo="Navegación" titulo="Todas las secciones" ancho="30rem">
      <div className="grid grid-cols-3 gap-2">
        {TODOS.map((i, k) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            onClick={onCerrar}
            style={{ '--i': k }}
            className={({ isActive }) => `hoja-op ${isActive ? 'hoja-op--activa' : ''}`}
          >
            <span className="hoja-op-ico"><i.icon size={17} strokeWidth={1.9} /></span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </div>
      <p className="mb-2 mt-4 text-center font-mono text-t-nota text-textSecondary">
        Desliza con el dedo para cambiar de sección
      </p>
    </Hoja>
  );
}

/**
 * Deslizar de lado en el celular para pasar a la sección vecina, como en una app nativa.
 * Devuelve los manejadores que hay que poner en el contenedor del contenido.
 */
export function useDeslizarSecciones(activo) {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const toque = useRef(null);
  const [saliendo, setSaliendo] = useState(0);

  const alEmpezar = useCallback((e) => {
    if (!activo || e.touches.length !== 1) return;
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, [activo]);

  const alTerminar = useCallback((e) => {
    const t0 = toque.current;
    toque.current = null;
    if (!t0 || !activo) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - t0.x;
    const dy = t.clientY - t0.y;
    const rapido = Date.now() - t0.t < 600;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 45 || !rapido) return;
    const i = PRIMARIAS.findIndex((s) => (s.to === '/' ? pathname === '/' : pathname.startsWith(s.to)));
    if (i < 0) return;
    const destino = PRIMARIAS[i + (dx < 0 ? 1 : -1)];
    if (!destino) return;
    setSaliendo(dx < 0 ? 1 : -1);
    navegar(destino.to);
  }, [activo, navegar, pathname]);

  useEffect(() => { setSaliendo(0); }, [pathname]);

  return {
    props: { onTouchStart: alEmpezar, onTouchEnd: alTerminar },
    direccion: saliendo,
  };
}
