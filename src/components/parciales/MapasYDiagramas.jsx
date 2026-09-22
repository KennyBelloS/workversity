import { useMemo, useState } from 'react';
import { Network, Workflow } from 'lucide-react';
import { generarMapaConceptual, generarDiagramaFlujo } from '../../lib/parciales';

function MapaConceptual({ texto, titulo }) {
  const mapa = useMemo(() => generarMapaConceptual(texto, titulo), [texto, titulo]);
  if (mapa.ramas.length === 0) return <p className="text-sm text-textSecondary">No hay suficiente texto para armar un mapa.</p>;
  const R = 150, cx = 200, cy = 200;
  return (
    <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-lg" role="img" aria-label={`Mapa conceptual de ${mapa.centro}`}>
      {mapa.ramas.map((r, i) => {
        const angulo = (i / mapa.ramas.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angulo), y = cy + R * Math.sin(angulo);
        return <line key={`l${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#5B8DEF" strokeOpacity="0.35" strokeWidth="2" />;
      })}
      <circle cx={cx} cy={cy} r="52" fill="#5B8DEF" />
      <foreignObject x={cx - 48} y={cy - 30} width="96" height="60"><div className="flex h-full items-center justify-center text-center text-[11px] font-extrabold leading-tight text-white">{mapa.centro}</div></foreignObject>
      {mapa.ramas.map((r, i) => {
        const angulo = (i / mapa.ramas.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angulo), y = cy + R * Math.sin(angulo);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="34" fill="white" stroke="#5B8DEF" strokeWidth="2" />
            <foreignObject x={x - 32} y={y - 24} width="64" height="48"><div title={r.detalle} className="flex h-full items-center justify-center text-center text-[9.5px] font-bold leading-tight text-textPrimary">{r.palabra}</div></foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

function DiagramaFlujo({ texto }) {
  const pasos = useMemo(() => generarDiagramaFlujo(texto), [texto]);
  if (pasos.length === 0) return <p className="text-sm text-textSecondary">No hay suficiente texto para un diagrama.</p>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      {pasos.map((p, i) => (
        <div key={p.n} className="w-full">
          <div className="flex items-start gap-3 rounded-md2 border-2 border-primary/40 bg-white p-3 shadow-card">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{p.n}</span>
            <p className="text-sm">{p.texto}</p>
          </div>
          {i < pasos.length - 1 && <div className="mx-auto h-6 w-0.5 bg-primary/40" />}
        </div>
      ))}
    </div>
  );
}

/** Mapa conceptual (radial) y diagrama de flujo (pasos), generados a partir del texto de tus fuentes. */
export default function MapasYDiagramas({ texto, titulo }) {
  const [modo, setModo] = useState('mapa');
  if (!texto) return <p className="rounded-md2 bg-white py-10 text-center text-sm text-textSecondary shadow-card">Sube o pega una fuente primero para generar el mapa y el diagrama.</p>;
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setModo('mapa')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${modo === 'mapa' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}><Network size={13} /> Mapa conceptual</button>
        <button onClick={() => setModo('flujo')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${modo === 'flujo' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}><Workflow size={13} /> Diagrama de flujo</button>
      </div>
      <div className="rounded-md2 bg-white p-4 shadow-card">
        {modo === 'mapa' ? <MapaConceptual texto={texto} titulo={titulo} /> : <DiagramaFlujo texto={texto} />}
      </div>
      <p className="mt-2 text-center text-[11px] text-textSecondary">Se genera solo, a partir de tus fuentes: úsalo como punto de partida y edítalo con tus propias palabras al estudiar.</p>
    </div>
  );
}
