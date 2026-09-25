import { useMemo, useState } from 'react';
import { Network, Workflow, Lightbulb } from 'lucide-react';
import { generarMapaConceptual, generarDiagramaFlujo } from '../../lib/parciales';

const PALETA = ['#5B8DEF', '#8B7FD1', '#17C964', '#F5A524', '#E5789C', '#7FD1C3', '#3E7BFA', '#F97066', '#2EAEB0'];

/**
 * Mapa conceptual jerárquico: el tema arriba, y debajo una tarjeta por cada término con
 * su relación y su definición completa (sin truncar), para que de verdad se pueda leer y
 * estudiar con él, no solo decorar.
 */
function MapaConceptual({ texto, titulo }) {
  const mapa = useMemo(() => generarMapaConceptual(texto, titulo), [texto, titulo]);
  if (mapa.ramas.length === 0) return <MensajeVacio texto="No se encontraron suficientes ideas para armar un mapa. Prueba con un texto que tenga definiciones (\u201cX es Y\u201d, \u201cX: Y\u201d)." />;
  return (
    <div>
      <div className="mx-auto mb-5 w-fit rounded-full bg-primary px-5 py-2.5 text-center text-sm font-extrabold text-white shadow-md">{mapa.centro}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mapa.ramas.map((r, i) => (
          <div key={i} className="rounded-md2 border-2 bg-white p-3 shadow-card" style={{ borderColor: PALETA[i % PALETA.length] }}>
            <p className="text-sm font-extrabold" style={{ color: PALETA[i % PALETA.length] }}>{r.palabra}</p>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-textSecondary">{r.relacion}</p>
            <p className="text-sm leading-snug text-textPrimary">{r.detalle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagramaFlujo({ texto }) {
  const pasos = useMemo(() => generarDiagramaFlujo(texto), [texto]);
  if (pasos.length === 0) {
    return <MensajeVacio texto="Este texto parece ser definiciones o datos sueltos, no un proceso paso a paso, así que forzar un diagrama de flujo no ayudaría a entenderlo. Funciona mejor con instrucciones numeradas o palabras como “primero”, “luego”, “finalmente”. Prueba con el mapa conceptual para este contenido." icono={Network} />;
  }
  return (
    <div className="mx-auto flex max-w-lg flex-col items-stretch">
      {pasos.map((p, i) => (
        <div key={p.n} className="w-full">
          <div className="flex items-start gap-3 rounded-md2 border-2 border-primary/40 bg-white p-3.5 shadow-card">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{p.n}</span>
            <p className="text-sm leading-snug">{p.texto}</p>
          </div>
          {i < pasos.length - 1 && <div className="mx-auto flex h-7 w-0.5 items-end justify-center bg-primary/40"><span className="mb-[-6px] text-primary/60">▼</span></div>}
        </div>
      ))}
    </div>
  );
}

function MensajeVacio({ texto, icono: Icono = Lightbulb }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icono size={26} className="text-textSecondary/50" />
      <p className="max-w-sm text-sm text-textSecondary">{texto}</p>
    </div>
  );
}

/** Mapa conceptual (jerárquico) y diagrama de flujo (pasos reales), a partir del texto de tus fuentes. */
export default function MapasYDiagramas({ texto, titulo }) {
  const [modo, setModo] = useState('mapa');
  if (!texto) return <MensajeVacio texto="Sube o pega una fuente primero para generar el mapa y el diagrama." icono={Network} />;
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
