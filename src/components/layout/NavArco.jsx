import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, KanbanSquare, BookOpen, Wallet, Sparkles, MoreHorizontal, X } from 'lucide-react';

// ---------------------------------------------------------------------------------------------
// Navegación en arco para celular (referencia: el menú curvo que sale de la esquina).
// Un solo botón en la esquina inferior derecha. Al mantenerlo pulsado, las secciones salen
// abiertas en abanico sobre un cuarto de círculo, cada una con su color y su etiqueta girada
// según su posición en la curva. Se puede soltar encima de una para entrar (gesto de un pulgar)
// o tocar el botón, elegir y tocar la sección.
// ---------------------------------------------------------------------------------------------

export const SECCIONES_ARCO = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, color: '58 91 255', end: true },
  { to: '/horario', label: 'Agenda', icon: CalendarClock, color: '62 126 124' },
  { to: '/tareas', label: 'Tareas', icon: KanbanSquare, color: '176 74 62' },
  { to: '/materias', label: 'Materias', icon: BookOpen, color: '168 115 42' },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, color: '47 122 85' },
  { to: '/analitica', label: 'Asistente', icon: Sparkles, color: '107 95 168' },
  { to: '__mas', label: 'Más', icon: MoreHorizontal, color: '122 106 88' },
];

const A0 = 95; // ángulo del primer elemento (grados, 90 = arriba)
const A1 = 177; // ángulo del último (180 = a la izquierda)

const grados = (i, n) => A0 + ((A1 - A0) * i) / Math.max(1, n - 1);
const aRad = (g) => (g * Math.PI) / 180;

export default function NavArco({ extra = [], onMas }) {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1); // resaltado mientras se arrastra
  // El abanico es una elipse: ancho limitado por la pantalla, alto por el largo del teléfono.
  const [radio, setRadio] = useState({ x: 230, y: 380 });
  const ancla = useRef(null);
  const arrastre = useRef({ moviendo: false, desde: null, yaEstaba: false });
  const items = SECCIONES_ARCO;

  const actual = items.find((s) => (s.end ? pathname === s.to : s.to !== '__mas' && pathname.startsWith(s.to)))
    || (extra.some((e) => pathname.startsWith(e.to)) ? items[items.length - 1] : items[0]);

  // El abanico se adapta: nunca se sale por la izquierda ni por arriba.
  useEffect(() => {
    const medir = () => setRadio({
      x: Math.max(120, Math.min(300, window.innerWidth - 152)),
      y: Math.max(170, Math.min(470, window.innerHeight * 0.54)),
    });
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const cerrar = useCallback(() => { setAbierto(false); setActivo(-1); }, []);
  useEffect(() => { cerrar(); }, [pathname, cerrar]);

  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setActivo((v) => (v <= 0 ? items.length - 1 : v - 1)); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActivo((v) => (v >= items.length - 1 ? 0 : v + 1)); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (activo >= 0) elegir(items[activo]); }
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  });

  const elegir = (s) => {
    try { navigator.vibrate?.(12); } catch { /* el navegador puede no permitirlo */ }
    cerrar();
    if (s.to === '__mas') onMas?.();
    else navegar(s.to);
  };

  // Gesto: mantener pulsado el botón y deslizar hasta la sección; al soltar, entra.
  const alPresionar = (e) => {
    const caja = ancla.current?.getBoundingClientRect();
    if (!caja) return;
    const ox = caja.left + caja.width / 2;
    const oy = caja.top + caja.height / 2;
    arrastre.current = { moviendo: false, desde: { x: e.clientX, y: e.clientY }, yaEstaba: abierto };
    setAbierto(true);
    const mover = (ev) => {
      const dx = ev.clientX - ox;
      const dy = ev.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (Math.hypot(ev.clientX - arrastre.current.desde.x, ev.clientY - arrastre.current.desde.y) > 10) arrastre.current.moviendo = true;
      if (!arrastre.current.moviendo) return;
      if (d < 56) { setActivo(-1); return; }
      let a = (Math.atan2(-dy / radioRef.current.y, dx / radioRef.current.x) * 180) / Math.PI; // 90 = arriba, 180 = izquierda
      if (a < 0) a += 360;
      const paso = (A1 - A0) / (items.length - 1);
      const i = Math.round((a - A0) / paso);
      setActivo(i >= 0 && i < items.length ? i : -1);
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      if (arrastre.current.moviendo) {
        const i = activoRef.current;
        if (i >= 0) elegir(items[i]); else cerrar();
      }
    };
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  };
  // El manejador de "soltar" necesita el último valor sin volver a suscribirse.
  const activoRef = useRef(activo);
  activoRef.current = activo;
  const radioRef = useRef(radio);
  radioRef.current = radio;

  const color = activo >= 0 ? items[activo].color : actual.color;
  const Icono = actual.icon;

  const capa = (
    <div className={`arco ${abierto ? 'arco--abierto' : ''}`} style={{ '--arco-color': `rgb(${color})` }}>
      <button type="button" className="arco-velo" aria-label="Cerrar el menú" tabIndex={abierto ? 0 : -1} onClick={cerrar} />

      {/* El filo curvo de la esquina, que se enciende al abrir. */}
      <svg className="arco-filo" viewBox="0 0 120 120" aria-hidden="true" preserveAspectRatio="none">
        <path d="M120 0 V60 A60 60 0 0 1 60 120 H0" />
      </svg>

      <ul className="arco-lista" role="menu" aria-label="Secciones">
        {items.map((s, i) => {
          const g = grados(i, items.length);
          const x = Math.cos(aRad(g)) * radio.x;
          const y = Math.sin(aRad(g)) * radio.y;
          const giro = (g - A0) * -0.13;
          const esActual = s.to === actual.to;
          const It = s.icon;
          return (
            <li
              key={s.to}
              role="none"
              className={`arco-item ${activo === i ? 'arco-item--activo' : ''} ${esActual ? 'arco-item--actual' : ''}`}
              style={{ '--x': `${x}px`, '--y': `${-y}px`, '--g': `${giro}deg`, '--i': i, '--c': `rgb(${s.color})` }}
            >
              <button type="button" role="menuitem" tabIndex={abierto ? 0 : -1} onClick={() => elegir(s)} onPointerEnter={() => setActivo(i)}>
                <span className="arco-texto">{s.label}</span>
                <span className="arco-disco"><It size={17} strokeWidth={1.9} /></span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        ref={ancla}
        type="button"
        className="arco-boton"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar el menú de secciones' : `Secciones. Estás en ${actual.label}`}
        onPointerDown={alPresionar}
        onClick={() => { if (!arrastre.current.moviendo && arrastre.current.yaEstaba) cerrar(); }}
        style={{ '--c': `rgb(${actual.color})` }}
      >
        {abierto ? <X size={21} strokeWidth={2} /> : <Icono size={21} strokeWidth={1.9} />}
        <span className="arco-pulso" aria-hidden="true" />
      </button>
    </div>
  );
  return createPortal(capa, document.body);
}
