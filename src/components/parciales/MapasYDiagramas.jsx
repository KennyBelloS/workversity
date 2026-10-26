import { useMemo, useState } from 'react';
import { Network, Workflow, Lightbulb } from 'lucide-react';
import { generarMapaConceptual, generarDiagramaFlujo } from '../../lib/parciales';
import { mapaConceptualAMermaid, diagramaFlujoAMermaid } from '../../lib/mermaidTexto';
import DiagramaMermaid from './DiagramaMermaid';
import { useTema } from '../../hooks/useTema';

function MensajeVacio({ texto, icono: Icono = Lightbulb }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icono size={26} className="text-textSecondary/50" />
      <p className="max-w-sm text-sm text-textSecondary">{texto}</p>
    </div>
  );
}

/** Mapa conceptual y diagrama de flujo, dibujados con Mermaid (una librería real de diagramas). */
export default function MapasYDiagramas({ texto, titulo }) {
  const [modo, setModo] = useState('mapa');
  const { oscuro } = useTema();

  const mapa = useMemo(() => (texto ? generarMapaConceptual(texto, titulo) : null), [texto, titulo]);
  const pasos = useMemo(() => (texto ? generarDiagramaFlujo(texto) : []), [texto]);
  const codigoMapa = useMemo(() => mapaConceptualAMermaid(mapa), [mapa]);
  const codigoFlujo = useMemo(() => diagramaFlujoAMermaid(pasos), [pasos]);

  if (!texto) return <MensajeVacio texto="Sube o pega una fuente primero para generar el mapa y el diagrama." icono={Network} />;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setModo('mapa')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${modo === 'mapa' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}><Network size={13} /> Mapa conceptual</button>
        <button onClick={() => setModo('flujo')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${modo === 'flujo' ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}><Workflow size={13} /> Diagrama de flujo</button>
      </div>
      <div className="rounded-md2 bg-white p-4 shadow-card">
        {modo === 'mapa' ? (
          codigoMapa ? <DiagramaMermaid codigo={codigoMapa} oscuro={oscuro} /> : <MensajeVacio texto="No se encontraron suficientes ideas para armar un mapa. Prueba con un texto que tenga definiciones (“X es Y”, “X: Y”)." />
        ) : (
          codigoFlujo ? <DiagramaMermaid codigo={codigoFlujo} oscuro={oscuro} /> : <MensajeVacio texto="Este texto parece ser definiciones o datos sueltos, no un proceso paso a paso, así que forzar un diagrama de flujo no ayudaría a entenderlo. Funciona mejor con instrucciones numeradas o palabras como “primero”, “luego”, “finalmente”. Prueba con el mapa conceptual para este contenido." icono={Network} />
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-textSecondary">Se genera solo, a partir de tus fuentes: úsalo como punto de partida y edítalo con tus propias palabras al estudiar.</p>
    </div>
  );
}
