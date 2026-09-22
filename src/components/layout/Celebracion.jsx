import { useEffect, useState } from 'react';

const COLORES = ['#5B8DEF', '#17C964', '#F5A524', '#E5789C', '#8B7FD1', '#7FD1C3'];

function Rafaga() {
  const [piezas] = useState(() => Array.from({ length: 28 }, (_, i) => ({
    i, color: COLORES[i % COLORES.length], dx: Math.round((Math.random() - 0.5) * 460), dy: Math.round(120 + Math.random() * 360), rot: Math.round((Math.random() - 0.5) * 900), delay: Math.random() * 0.12,
  })));
  return piezas.map((p) => (
    <span key={p.i} className="anim-confeti absolute left-1/2 top-[38%] block h-3 w-2 rounded-[2px]" style={{ backgroundColor: p.color, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg`, animationDelay: `${p.delay}s` }} />
  ));
}

/** Lluvia de confeti al completar una tarea o desbloquear un logro. */
export default function Celebracion() {
  const [rafagas, setRafagas] = useState([]);
  useEffect(() => {
    const lanzar = () => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const id = Date.now() + Math.random();
      setRafagas((r) => [...r, id]);
      setTimeout(() => setRafagas((r) => r.filter((x) => x !== id)), 2000);
    };
    window.addEventListener('workversity:celebrar', lanzar);
    return () => window.removeEventListener('workversity:celebrar', lanzar);
  }, []);
  return <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">{rafagas.map((id) => <Rafaga key={id} />)}</div>;
}
